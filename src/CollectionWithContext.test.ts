import { CollectionWithContext } from './CollectionWithContext';

type Organization = {
  id: string;
  name: string;
};

const makeOrganization = (id: string, name: string) => ({ id, name });

type Context = {
  status: 'stale' | 'fresh';
};

describe('CollectionWithContext', () => {
  it('should instantiate', () => {
    const collection = new CollectionWithContext<Organization, Context>({
      data: [makeOrganization('1', 'Org1')],
      getItemId: (item) => item.id,
      context: {
        status: 'stale',
      },
    });
    expect(collection).toBeDefined();
  });

  it('should receive all changes at once', () => {
    const collection = new CollectionWithContext<Organization, Context>({
      data: [makeOrganization('1', 'Org1'), makeOrganization('2', 'Org2')],
      getItemId: (item) => item.id,
      context: {
        status: 'stale',
      },
    });
    const subscriber = jest.fn();
    collection.subscribe(subscriber);
    collection.update(
      (data) => {
        data.updateItem('1', { name: 'Org_1' });
        data.updateItem('2', { name: 'Org_2' });
      },
      { status: 'fresh' }
    );
    expect(subscriber).toBeCalledTimes(1);
    expect(subscriber).toBeCalledWith({
      data: [
        { id: '1', name: 'Org_1' },
        { id: '2', name: 'Org_2' },
      ],
      context: {
        status: 'fresh',
      },
    });
  });

  it('should stop receiving updates when unsubscribed', () => {
    const collection = new CollectionWithContext<Organization, Context>({
      data: [makeOrganization('1', 'Org1')],
      getItemId: (item) => item.id,
      context: {
        status: 'stale',
      },
    });
    const subscriber = jest.fn();
    const subscription = collection.subscribe(subscriber);
    collection.update(
      (data) => {
        data.updateItem('1', { name: 'Org_1' });
      },
      { status: 'fresh' }
    );
    expect(subscriber).toBeCalledTimes(1);
    subscription.remove();
    collection.update((data) => {
      data.updateItem('1', { name: 'Org_2' });
    });
    expect(subscriber).toBeCalledTimes(1);
  });
});
