import { Subscribable } from './Subscribable';
import { Collection, CollectionOptions } from './Collection';

export interface CollectionWithContextOptions<
  T extends object,
  C extends object
> extends CollectionOptions<T> {
  context: C;
}

export class CollectionWithContext<T extends object, C extends object>
  implements Subscribable
{
  private readonly data: Collection<T>;
  private dataSnapshot: T[];

  private context: C;

  private subscribers = new Set<
    (snapshot: { data: T[]; context: C }) => void
  >();

  constructor(options: CollectionWithContextOptions<T, C>) {
    const { context, ...collectionOptions } = options;
    this.context = context;
    this.data = new Collection<T>(collectionOptions);
    this.dataSnapshot = this.data.buildSnapshot();
    this.data.subscribe(this.handleDataChanges);
  }

  private handleDataChanges = (snapshot: T[]) => {
    this.dataSnapshot = snapshot;
  };

  subscribe(subscriber: (snapshot: { data: T[]; context: C }) => void) {
    this.subscribers.add(subscriber);
    return {
      remove: () => {
        this.subscribers.delete(subscriber);
      },
    };
  }

  private publishChanges() {
    this.subscribers.forEach((subscriber) => {
      subscriber({
        data: this.dataSnapshot,
        context: this.context,
      });
    });
  }

  update(updater?: (data: Collection<T>) => void, context?: Partial<C>) {
    if (updater) {
      updater(this.data);
    }
    if (context) {
      this.context = {
        ...this.context,
        ...context,
      };
    }
    this.publishChanges();
  }
}
