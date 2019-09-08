import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpeakingService {

  private audioContext: AudioContext;
  private sayTimeout;

  public speak = true;

  private queueSignature = 0;
  private utteranceQueue: SpeechSynthesisUtterance[] = [];

  consecutiveBeepTimeout = null;

  timestamp: number;

  constructor() {
    this.audioContext = new AudioContext();
  }

  read(message: string) {
    if (this.speak) {
      this._read(message);
    }
  }

  get isSpeaking() {
    return speechSynthesis.speaking;
  }

  stop() {
    speechSynthesis.cancel();
  }

  beep(volume: number, frequency: number, duration: number, stopOthers= true) {
    if (stopOthers) {
      this.stop();
      if (this.consecutiveBeepTimeout) {
        clearTimeout(this.consecutiveBeepTimeout);
      }
    }
    const v = this.audioContext.createOscillator();
    const u = this.audioContext.createGain();
    v.connect(u);
    v.frequency.value = frequency;
    v.type = 'square';
    u.connect(this.audioContext.destination);
    u.gain.value = volume * 0.01;
    v.start(this.audioContext.currentTime);
    v.stop(this.audioContext.currentTime + duration * 0.001);
  }

  consecutiveBeep(beeps: {volume: number, pitch: number, duration: number}[], first= true) {
    console.log('consec', beeps);
    if (beeps.length === 0) {
      return;
    } else {
      const {volume, pitch, duration} = beeps[0];
      this.beep(volume, pitch, duration, first);
      this.consecutiveBeepTimeout = setTimeout(() => this.consecutiveBeep(beeps.slice(1), false), duration);
    }

  }

  beep_error() {
    this.beep(5, 700, 150);
  }

  beep_detect() {
    this.beep(5, 350, 150);
  }

  private _makeUtterance(sentence: string, speed: 'slow' | 'normal' | 'fast' = 'fast') {
    const utt = new SpeechSynthesisUtterance(sentence);
    // utt.lang = 'ko-KR';
    utt.lang = 'en-US';
    if (speed === 'slow') {
      utt.rate = 0.5;
    } else if (speed === 'normal') {
      utt.rate = 1;
    } else {
      utt.rate = 1.5;
    }
    utt.volume = 1;
    return utt;
  }

  private _read(message: string) {
    const timestamp = Date.now();
    this.timestamp = timestamp;
    this.stop();
    setTimeout(() => {
      if (this.timestamp !== timestamp) { return; }
      const utts = message.split(';').map(sentence => this._makeUtterance(sentence));
      const sig = ++ this.queueSignature;
      this._speakUtterances(utts, sig);
    }, 250);
  }

  private _speakUtterances(utterances: SpeechSynthesisUtterance[], signature: number) {
    if (signature !== this.queueSignature) { return; }
    if (!utterances.length) { return; }
    const utt = utterances[0];
    const remainingUtts = utterances.slice(1);
    window.speechSynthesis.speak(utt);
    utt.onend = () => {
      this._speakUtterances(remainingUtts, signature);
    };
  }

}
