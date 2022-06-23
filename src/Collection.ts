import { Subscribable } from './Subscribable';

export interface CollectionOptions<T extends object> {
  data: T[];
  getItemId: (item: T) => string;
  areItemsEqual?: (item1: T, item2: T) => boolean;
}

export class Collection<T extends object> implements Subscribable {
  private dataIds: string[] = [];
  private dataMap = new Map<string, T>();

  private readonly getItemId: CollectionOptions<T>['getItemId'];
  private readonly areItemsEqual: CollectionOptions<T>['areItemsEqual'];

  private autoUpdate = true;
  private updateNeeded = false;

  private subscribers = new Set<(snapshot: T[]) => void>();

  constructor(options: CollectionOptions<T>) {
    const { data, getItemId, areItemsEqual } = options;
    this.getItemId = getItemId;
    this.areItemsEqual = areItemsEqual;
    this.setData(data);
  }

  setAutoUpdate(enabled: boolean) {
    this.autoUpdate = enabled;
    if (enabled) {
      this.performUpdate();
    }
  }

  isAutoUpdateEnabled() {
    return this.autoUpdate;
  }

  setUpdateNeeded(updateNeeded: boolean) {
    this.updateNeeded = updateNeeded;
  }

  isUpdateNeeded() {
    return this.updateNeeded;
  }

  markForUpdate() {
    this.setUpdateNeeded(true);
    if (this.isAutoUpdateEnabled()) {
      this.performUpdate();
    }
  }

  buildSnapshot() {
    return this.dataIds.map((itemId) => {
      const item = this.dataMap.get(itemId);
      if (!item) {
        throw new Error(`Item with id "${itemId}" was not found`);
      }
      return item;
    });
  }

  performUpdate() {
    if (!this.isUpdateNeeded()) {
      return;
    }
    const snapshot = this.buildSnapshot();
    this.subscribers.forEach((subscriber) => {
      subscriber(snapshot);
    });
    this.setUpdateNeeded(false);
  }

  subscribe(subscriber: (snapshot: T[]) => void) {
    this.subscribers.add(subscriber);
    return {
      remove: () => {
        this.subscribers.delete(subscriber);
      },
    };
  }

  setData(data: T[]) {
    this.setAutoUpdate(false);
    data.forEach((item) => {
      this.addItem(item);
    });
    this.setAutoUpdate(true);
  }

  addItem(item: T) {
    const itemId = this.getItemId(item);
    this.dataIds.push(itemId);
    this.dataMap.set(itemId, item);
    this.markForUpdate();
  }

  updateItem(id: string, updates: Partial<T>) {
    const oldItem = this.dataMap.get(id);
    if (!oldItem) {
      return false;
    }
    const newItem = {
      ...oldItem,
      ...updates,
    };
    if (this.areItemsEqual?.(oldItem, newItem)) {
      return false;
    }
    this.dataMap.set(id, newItem);
    this.markForUpdate();
    return true;
  }

  removeItem(id: string) {
    const itemIndex = this.dataIds.indexOf(id);
    if (itemIndex < 0) {
      return;
    }
    this.dataIds.splice(itemIndex, 1);
    this.dataMap.delete(id);
    this.markForUpdate();
  }
}
