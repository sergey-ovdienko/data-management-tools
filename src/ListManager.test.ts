import {
  DataManagerStatus,
  ListManager,
  ListNetworkManager,
  ListStoreManager,
} from './ListManager';

type Organization = {
  id: string;
  name: string;
};

const makeOrganization = (id: string, name: string) => ({ id, name });

const ORG_1 = makeOrganization('1', 'Asdf');
const ORG_2 = makeOrganization('2', 'Qwerty');
const ORG_3 = makeOrganization('3', 'Zxcvbn');

let storeManager: ListStoreManager<Organization>;
let networkManager: ListNetworkManager<Organization>;

describe('ListManager', () => {
  beforeEach(() => {
    storeManager = {
      getData: jest.fn(() => Promise.resolve([ORG_1])),
      setData: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
    };
    networkManager = {
      getData: jest.fn(() => Promise.resolve([ORG_1, ORG_2])),
    };
  });

  it('should instantiate', () => {
    const dm = new ListManager<Organization>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
    });
    expect(dm).toBeDefined();
  });

  it('should not initialize by default', () => {
    const dm = new ListManager<Organization>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
    });
    expect(dm.getContext().status).toEqual(DataManagerStatus.NotInitialized);
  });

  it('should initialize if autoInit flag is set', () => {
    const dm = new ListManager<Organization>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
      autoInit: true,
    });
    expect(dm.getContext().status).toEqual(DataManagerStatus.Initializing);
  });

  it('should initialize if initialData is set', () => {
    const dm = new ListManager<Organization>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
      initialData: [ORG_1],
    });
    expect(dm.getContext().status).toEqual(DataManagerStatus.Fresh);
  });

  it('should initialize on first subscribe', () => {
    const dm = new ListManager<Organization>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
    });
    const subscriber = jest.fn();
    expect(dm.getContext().status).toEqual(DataManagerStatus.NotInitialized);
    dm.subscribe(subscriber);
    expect(dm.getContext().status).toEqual(DataManagerStatus.Initializing);
  });

  it('should call storeManager to set initialData if it was passed', () => {
    const dm = new ListManager<Organization>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
      initialData: [ORG_1],
    });
    expect(storeManager.setData).toBeCalledWith([ORG_1]);
  });

  it('should initialize by calling store and network managers', async () => {
    const dm = new ListManager<Organization>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
    });
    const subscriber = jest.fn();
    dm.subscribe(subscriber);
    await new Promise(process.nextTick);
    expect(dm.getContext().status).toEqual(DataManagerStatus.Fresh);
    expect(storeManager.getData).toBeCalled();
    expect(networkManager.getData).toBeCalled();
    expect(storeManager.setData).toBeCalledWith([ORG_1, ORG_2]);
  });

  it('should emit updated collection when adding item', async () => {
    const dm = new ListManager<Organization>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
    });
    const subscriber = jest.fn();
    dm.subscribe(subscriber);
    await new Promise(process.nextTick);
    await dm.addItem(ORG_3);
    expect(subscriber).lastCalledWith({
      data: [ORG_1, ORG_2, ORG_3],
      context: {
        status: DataManagerStatus.Fresh,
      },
    });
  });

  it('should call storeManager.addItem when adding item', async () => {
    const dm = new ListManager<Organization>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
    });
    const subscriber = jest.fn();
    dm.subscribe(subscriber);
    await new Promise(process.nextTick);
    await dm.addItem(ORG_3);
    expect(storeManager.addItem).toBeCalledWith(ORG_3);
  });

  it('should emit updated collection when updating item', async () => {
    const dm = new ListManager<Organization>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
    });
    const subscriber = jest.fn();
    dm.subscribe(subscriber);
    await new Promise(process.nextTick);
    await dm.updateItem(ORG_2.id, { ...ORG_2, name: 'Qwertyuiop' });
    expect(subscriber).lastCalledWith({
      data: [ORG_1, { ...ORG_2, name: 'Qwertyuiop' }],
      context: {
        status: DataManagerStatus.Fresh,
      },
    });
  });

  it('should call storeManager.updateItem when updating item', async () => {
    const dm = new ListManager<Organization>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
    });
    const subscriber = jest.fn();
    dm.subscribe(subscriber);
    await new Promise(process.nextTick);
    await dm.updateItem(ORG_2.id, { ...ORG_2, name: 'Qwertyuiop' });
    expect(storeManager.updateItem).toBeCalledWith({
      ...ORG_2,
      name: 'Qwertyuiop',
    });
  });

  it("should not call storeManager.updateItem when item hasn't really changed", async () => {
    const dm = new ListManager<Organization>({
      getItemId: (item) => item.id,
      areItemsEqual: (a, b) => a.id === b.id && a.name === b.name,
      storeManager,
      networkManager,
    });
    const subscriber = jest.fn();
    dm.subscribe(subscriber);
    await new Promise(process.nextTick);
    await dm.updateItem(ORG_2.id, ORG_2);
    expect(storeManager.updateItem).not.toBeCalled();
  });

  it('should emit updated collection when deleting item', async () => {
    const dm = new ListManager<Organization>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
    });
    const subscriber = jest.fn();
    dm.subscribe(subscriber);
    await new Promise(process.nextTick);
    await dm.deleteItem(ORG_2.id);
    expect(subscriber).lastCalledWith({
      data: [ORG_1],
      context: {
        status: DataManagerStatus.Fresh,
      },
    });
  });

  it('should call storeManager.deleteItem when deleting item', async () => {
    const dm = new ListManager<Organization>({
      getItemId: (item) => item.id,
      storeManager,
      networkManager,
    });
    const subscriber = jest.fn();
    dm.subscribe(subscriber);
    await new Promise(process.nextTick);
    await dm.deleteItem(ORG_2.id);
    expect(storeManager.deleteItem).toBeCalledWith(ORG_2.id);
  });
});
