import {
  CollectionWithContext,
  CollectionWithContextOptions,
} from './CollectionWithContext';
import { ListStoreManager } from './ListStoreManager';

export interface ListResultSetOptions<T extends object, C extends object>
  extends CollectionWithContextOptions<T, C> {
  storeManager: ListStoreManager<T>;
}

export class ListResultSet<T extends object, C extends object> {
  protected storeManager: ListResultSetOptions<T, C>['storeManager'];
  protected resultSet: CollectionWithContext<T, C>;

  constructor(options: ListResultSetOptions<T, C>) {
    const { storeManager, ...collectionOptions } = options;
    this.storeManager = storeManager;
    this.resultSet = new CollectionWithContext<T, C>(collectionOptions);
  }

  async addItem(item: T) {
    this.resultSet.update((collection) => {
      collection.addItem(item);
    });
    await this.storeManager.addItem(item);
  }

  async updateItem(id: string, item: T) {
    let wasUpdated = false;
    this.resultSet.update((collection) => {
      wasUpdated = collection.updateItem(id, item);
    });
    if (wasUpdated) {
      await this.storeManager.updateItem(item);
    }
  }

  async deleteItem(id: string) {
    this.resultSet.update((collection) => {
      collection.deleteItem(id);
    });
    await this.storeManager.deleteItem(id);
  }
}
