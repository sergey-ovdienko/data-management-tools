interface Subscription {
  remove: () => void;
}

export interface Subscribable {
  subscribe: (subscriber: (snapshot: unknown) => void) => Subscription;
}
