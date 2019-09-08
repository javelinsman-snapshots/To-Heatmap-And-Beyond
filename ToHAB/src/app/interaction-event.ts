export class InteractionEvent {
}

export class ToHABSwipeEvent {
  direction: 'left' | 'right' | 'down' | 'up';
}

export class ToHABZoomEvent {
  direction: 'out' | 'in';
}

export class ToHABLockEvent {
  direction: 'horizontal' | 'vertical';
}

export class ToHABModeChangeEvent {
  direction: 'left' | 'right';
}




export class ToHABDragEvent {
  dx: number;
  dy: number;
  end: boolean;
}
