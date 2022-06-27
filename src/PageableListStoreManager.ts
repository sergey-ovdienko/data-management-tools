import { ListStoreManager } from './ListStoreManager';

export interface PageableListStoreManager<T, P> extends ListStoreManager<T> {
  addItems(item: T[]): Promise<void>;
  updateItems(item: T[]): Promise<void>;
  deleteItems(itemId: string[]): Promise<void>;
  getDataBetween(predicate: P, olderItem: T, newerItem?: T): Promise<T[]>;
}
