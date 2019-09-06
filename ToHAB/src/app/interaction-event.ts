export class InteractionEvent {
}

export class ToHABSwipeEvent {
  direction: 'left' | 'right' | 'down' | 'up';
}

export class ToHABZoomEvent {
  direction: 'out' | 'in';
}
