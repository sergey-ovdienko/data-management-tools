import { CollectionOptions } from './Collection';
import { Subscribable } from './Subscribable';
import { ListResultSet } from './ListResultSet';
import { ListNetworkManager } from './ListNetworkManager';
import { ListStoreManager } from './ListStoreManager';
import { DataManagerStatus } from './DataManagerStatus';

export interface ListManagerContext {
  status: DataManagerStatus;
}

export interface ListManagerOptions<T extends object>
  extends Pick<CollectionOptions<T>, 'getItemId' | 'areItemsEqual'> {
  initialData?: T[];
  autoInit?: boolean;
  storeManager: ListStoreManager<T>;
  networkManager: ListNetworkManager<T>;
}

export class ListManager<T extends object>
  extends ListResultSet<T, ListManagerContext>
  implements Subscribable
{
  private ready = false;
  private networkManager: ListNetworkManager<T>;
  private status: DataManagerStatus;

  constructor(options: ListManagerOptions<T>) {
    const {
      initialData,
      autoInit,
      storeManager,
      networkManager,
      ...collectionOptions
    } = options;
    const status = initialData
      ? DataManagerStatus.Fresh
      : DataManagerStatus.NotInitialized;
    super({
      storeManager,
      data: initialData ?? [],
      context: {
        status,
      },
      ...collectionOptions,
    });
    this.networkManager = networkManager;
    this.status = status;
    if (!initialData) {
      if (autoInit) {
        this.init();
      }
    } else {
      this.ready = true;
      this.storeManager.setData(initialData);
    }
  }

  subscribe(
    subscriber: (snapshot: { data: T[]; context: ListManagerContext }) => void
  ) {
    if (!this.ready) {
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
    this.ready = true;
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
}
