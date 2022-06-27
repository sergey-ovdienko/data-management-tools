import { PageableListStoreManager } from './PageableListStoreManager';
import { PageableListNetworkManager } from './PageableListNetworkManager';
import { PageableListManager } from './PageableListManager';
import { DataManagerStatus } from './DataManagerStatus';

type Organization = {
  id: string;
  name: string;
};

const makeOrganization = (id: string, name: string) => ({ id, name });

const ORG_1 = makeOrganization('1', 'Asdf');
const ORG_2 = makeOrganization('2', 'Qwerty');
const ORG_3 = makeOrganization('3', 'Zxcvbn');

let storeManager: PageableListStoreManager<Organization, undefined>;
let networkManager: PageableListNetworkManager<Organization, undefined>;

describe('PageableListManager', () => {
  beforeEach(() => {
    storeManager = {
      getData: jest.fn(() => Promise.resolve([ORG_1])),
      setData: jest.fn(),
      addItem: jest.fn(),
      addItems: jest.fn(),
      updateItem: jest.fn(),
      updateItems: jest.fn(),
      deleteItem: jest.fn(),
      deleteItems: jest.fn(),
      getDataBetween: jest.fn(),
    };
    networkManager = {
      getData: jest.fn(() => Promise.resolve([ORG_1, ORG_2])),
      getDataBefore: jest.fn((predicate: undefined, size: number) =>
        Promise.resolve([ORG_1, ORG_2])
      ),
    };
  });

  it('should autoInit', () => {
    const pageSize = 5;
    const dm = new PageableListManager<Organization, undefined>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
      pageSize,
      predicate: undefined,
      autoInit: true,
    });
    expect(dm).toBeDefined();
    expect(dm.getContext().status).toEqual(DataManagerStatus.Initializing);
  });

  it('should init on first subscribe', () => {
    const pageSize = 5;
    const dm = new PageableListManager<Organization, undefined>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
      pageSize,
      predicate: undefined,
    });
    expect(dm.getContext().status).toEqual(DataManagerStatus.NotInitialized);
    const subscriber = jest.fn();
    dm.subscribe(subscriber);
    expect(dm.getContext().status).toEqual(DataManagerStatus.Initializing);
  });

  it('should merge with stored data when initialData intersects it', async () => {
    const pageSize = 5;
    (
      storeManager.getDataBetween as jest.MockedFn<
        PageableListStoreManager<Organization, undefined>['getDataBetween']
      >
    ).mockImplementation(() => Promise.resolve([ORG_2, ORG_1]));
    const dm = new PageableListManager<Organization, undefined>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
      pageSize,
      predicate: undefined,
      initialData: [ORG_3, ORG_1],
    });
    await new Promise(process.nextTick);
    expect(storeManager.getDataBetween).toBeCalledWith(undefined, ORG_1);
    expect(storeManager.addItems).toBeCalledWith([ORG_3]);
    expect(storeManager.updateItems).toBeCalledWith([ORG_1]);
    expect(storeManager.deleteItems).toBeCalledWith([ORG_2.id]);
  });

  it("should replace stored data if it's empty when initialData is set", async () => {
    const pageSize = 5;
    (
      storeManager.getDataBetween as jest.MockedFn<
        PageableListStoreManager<Organization, undefined>['getDataBetween']
      >
    ).mockImplementation(() => Promise.resolve([]));
    const dm = new PageableListManager<Organization, undefined>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
      pageSize,
      predicate: undefined,
      initialData: [ORG_3, ORG_2, ORG_1],
    });
    await new Promise(process.nextTick);
    expect(storeManager.setData).toBeCalledWith([ORG_3, ORG_2, ORG_1]);
  });

  it('should replace stored data when initialData is empty', async () => {
    const pageSize = 5;
    const dm = new PageableListManager<Organization, undefined>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
      pageSize,
      predicate: undefined,
      initialData: [],
    });
    await new Promise(process.nextTick);
    expect(storeManager.setData).toBeCalledWith([]);
  });
});
