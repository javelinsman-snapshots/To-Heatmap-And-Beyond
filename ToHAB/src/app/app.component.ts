import { Component, OnInit } from '@angular/core';
import { InteractionManagerService } from './interaction-manager.service';
import { ToHABDataService } from './tohab-data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'idac-touch';

  constructor(
    private tohabDataService: ToHABDataService,
    private interactionManagerService: InteractionManagerService
  ) { }

  ngOnInit() {
    const tds = this.tohabDataService;
    this.interactionManagerService.on('swipe', tds.onInteractionSwipe.bind(tds));
    this.interactionManagerService.on('lock', tds.onInteractionLock.bind(tds));
    this.interactionManagerService.on('single-tap', tds.onInteractionSingleTap.bind(tds));
    this.interactionManagerService.on('double-tap', tds.onInteractionDoubleTap.bind(tds));
    this.interactionManagerService.on('three-finger-swipe', tds.onInteractionThreeFingerSwipe.bind(tds));
    this.interactionManagerService.on('drag', tds.onInteractionDrag.bind(tds));
    this.interactionManagerService.on('zoom', tds.onInteractionZoom.bind(tds));
  }


}

