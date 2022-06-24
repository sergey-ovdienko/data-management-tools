import { CollectionWithContext } from './CollectionWithContext';
import { CollectionOptions } from './Collection';
import { Subscribable } from './Subscribable';

export enum DataManagerStatus {
  NotInitialized = 'not_initialized',
  Initializing = 'initializing',
  Stale = 'stale',
  Fresh = 'fresh',
}

export type ListManagerContext = {
  status: DataManagerStatus;
};

export interface ListStoreManager<T> {
  getData(): Promise<T[]>;
  setData(data: T[]): Promise<void>;
  addItem(item: T): Promise<void>;
  updateItem(item: T): Promise<void>;
  deleteItem(itemId: string): Promise<void>;
}

export interface ListNetworkManager<T> {
  getData(): Promise<T[]>;
}

export interface ListManagerOptions<T extends object>
  extends Pick<CollectionOptions<T>, 'getItemId' | 'areItemsEqual'> {
  initialData?: T[];
  autoInit?: boolean;
  storeManager: ListStoreManager<T>;
  networkManager: ListNetworkManager<T>;
}

export class ListManager<T extends object> implements Subscribable {
  private autoInit: boolean;
  private storeManager: ListStoreManager<T>;
  private networkManager: ListNetworkManager<T>;
  private status: DataManagerStatus;
  private resultSet: CollectionWithContext<T, ListManagerContext>;

  constructor(options: ListManagerOptions<T>) {
    const {
      initialData,
      autoInit,
      storeManager,
      networkManager,
      ...collectionOptions
    } = options;
    this.storeManager = storeManager;
    this.networkManager = networkManager;
    this.status = initialData
      ? DataManagerStatus.Fresh
      : DataManagerStatus.NotInitialized;
    this.resultSet = new CollectionWithContext<T, ListManagerContext>({
      data: initialData ?? [],
      context: this.getContext(),
      ...collectionOptions,
    });
    if (!initialData) {
      this.autoInit = autoInit ?? false;
      if (this.autoInit) {
        this.init();
      }
    } else {
      this.autoInit = true;
      this.storeManager.setData(initialData);
    }
  }

  subscribe(
    subscriber: (snapshot: { data: T[]; context: ListManagerContext }) => void
  ) {
    if (!this.autoInit) {
      this.autoInit = true;
      this.init();
    }
    return this.resultSet.subscribe(subscriber);
  }

  getContext() {
    return {
      status: this.status,
    };
  }

  private setContext(status: DataManagerStatus) {
    this.status = status;
    return this.getContext();
  }

  private async init() {
    this.resultSet.update(
      undefined,
      this.setContext(DataManagerStatus.Initializing)
    );
    const storedData = await this.storeManager.getData();
    if (storedData.length) {
      this.resultSet.update((collection) => {
        collection.setData(storedData);
      }, this.setContext(DataManagerStatus.Stale));
    }
    const networkData = await this.networkManager.getData();
    this.resultSet.update((collection) => {
      collection.setData(networkData);
    }, this.setContext(DataManagerStatus.Fresh));
    await this.storeManager.setData(networkData);
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
