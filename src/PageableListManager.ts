import { ListResultSet } from './ListResultSet';
import { Subscribable } from './Subscribable';
import { CollectionOptions } from './Collection';
import { PageableListStoreManager } from './PageableListStoreManager';
import { PageableListNetworkManager } from './PageableListNetworkManager';
import { ListManagerContext } from './ListManager';
import { DataManagerStatus } from './DataManagerStatus';

export interface PageableListManagerContext extends ListManagerContext {}

export interface PageableListManagerOptions<T extends object, P>
  extends Pick<CollectionOptions<T>, 'getItemId' | 'areItemsEqual'> {
  initialData?: T[];
  autoInit?: boolean;
  pageSize: number;
  storeManager: PageableListStoreManager<T, P>;
  networkManager: PageableListNetworkManager<T, P>;
  predicate: P;
}

export class PageableListManager<T extends object, P>
  extends ListResultSet<T, PageableListManagerContext>
  implements Subscribable
{
  private ready = false;
  private networkManager: PageableListNetworkManager<T, P>;
  protected storeManager: PageableListStoreManager<T, P>;
  private status: PageableListManagerContext['status'];
  private readonly predicate: P;
  private readonly getItemId: (item: T) => string;

  constructor(options: PageableListManagerOptions<T, P>) {
    const {
      initialData,
      autoInit,
      storeManager,
      networkManager,
      predicate,
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
    this.status = status;
    this.networkManager = networkManager;
    this.storeManager = storeManager;
    this.predicate = predicate;
    this.getItemId = collectionOptions.getItemId;
    if (!initialData) {
      if (autoInit) {
        this.init();
      }
    } else {
      this.ready = true;
      this.initWithInitialData(initialData);
    }
  }

  getContext() {
    return {
      status: this.status,
    };
  }

  private setContext(changes: Partial<PageableListManagerContext>) {
    if (changes.status) {
      this.status = changes.status;
    }
    return this.getContext();
  }

  subscribe(
    subscriber: (snapshot: {
      data: T[];
      context: PageableListManagerContext;
    }) => void
  ) {
    if (!this.ready) {
      this.init();
    }
    return this.resultSet.subscribe(subscriber);
  }

  private async initWithInitialData(initialData: T[]) {
    if (!initialData.length) {
      return await this.replaceStoredData(initialData);
    }
    const oldestItem = initialData[initialData.length - 1];
    const storedPortion = await this.storeManager.getDataBetween(
      this.predicate,
      oldestItem
    );
    if (storedPortion.length) {
      return await this.updateStoredData(initialData, storedPortion);
    }
    await this.replaceStoredData(initialData);
  }

  private async init() {
    this.ready = true;
    this.resultSet.update(
      undefined,
      this.setContext({ status: DataManagerStatus.Initializing })
    );
    const storedData = await this.storeManager.getData();
    if (storedData.length) {
      this.resultSet.update((collection) => {
        collection.setData(storedData);
      }, this.setContext({ status: DataManagerStatus.Stale }));
    }
    const networkData = await this.networkManager.getData();
    this.resultSet.update((collection) => {
      collection.setData(networkData);
    }, this.setContext({ status: DataManagerStatus.Fresh }));
    await this.updateStoredData(networkData, storedData);
  }

  private async updateStoredData(newerData: T[], olderData: T[]) {
    const newerItemIds = newerData.map((item) => this.getItemId(item));
    const olderItemIds = olderData.map((item) => this.getItemId(item));
    const intersectingFromIndex = newerData.findIndex((item) =>
      olderItemIds.includes(this.getItemId(item))
    );
    if (intersectingFromIndex < 0) {
      return await this.replaceStoredData(newerData);
    }
    const addedItems = newerData.slice(0, intersectingFromIndex);
    const { updatedItems, deletedItems } = olderData.reduce<{
      updatedItems: T[];
      deletedItems: T[];
    }>(
      (acc, item) => {
        if (newerItemIds.includes(this.getItemId(item))) {
          acc.updatedItems.push(item);
        } else {
          acc.deletedItems.push(item);
        }
        return acc;
      },
      { updatedItems: [], deletedItems: [] }
    );
    if (addedItems.length) {
      await this.storeManager.addItems(addedItems);
    }
    if (updatedItems.length) {
      await this.storeManager.updateItems(updatedItems);
    }
    if (deletedItems.length) {
      await this.storeManager.deleteItems(
        deletedItems.map((item) => this.getItemId(item))
      );
    }
  }

  private async replaceStoredData(data: T[]) {
    await this.storeManager.setData(data);
  }
}
