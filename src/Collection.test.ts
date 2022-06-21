import { Collection } from "./Collection";

type User = {
  id: string;
  firstName: string;
  lastName: string;
};

const makeUser = (id: string, firstName: string, lastName: string) => ({
  id,
  firstName,
  lastName,
});

const getItemId = (item: User) => item.id;

describe("Collection", () => {
  it("should build a snapshot correctly", () => {
    const user = makeUser("1", "John", "Doe");
    const collection = new Collection<User>({
      data: [user],
      getItemId,
    });
    expect(collection.buildSnapshot()).toEqual([user]);
  });

  it("should pass a snapshot to a subscriber when setting new data", () => {
    const collection = new Collection<User>({
      data: [],
      getItemId,
    });
    const subscriber = jest.fn();
    collection.subscribe(subscriber);
    expect(subscriber).not.toBeCalled();
    const user1 = makeUser("1", "John", "Doe");
    const user2 = makeUser("2", "Jack", "Boe");
    const user3 = makeUser("3", "Jill", "Joe");
    collection.setData([user1, user2, user3]);
    expect(subscriber).toBeCalledTimes(1);
    expect(subscriber).toBeCalledWith([user1, user2, user3]);
  });

  it("should pass a snapshot to a subscriber when adding item", () => {
    const user1 = makeUser("1", "John", "Doe");
    const collection = new Collection<User>({
      data: [user1],
      getItemId,
    });
    const subscriber = jest.fn();
    collection.subscribe(subscriber);
    const user2 = makeUser("2", "Jack", "Boe");
    collection.addItem(user2);
    expect(subscriber).toBeCalledWith([user1, user2]);
  });

  it("should pass a snapshot to a subscriber when updating item", () => {
    const user = makeUser("1", "John", "Doe");
    const collection = new Collection<User>({
      data: [user],
      getItemId,
    });
    const subscriber = jest.fn();
    collection.subscribe(subscriber);
    collection.updateItem(user.id, { firstName: "Jack" });
    expect(subscriber).toBeCalledWith([{ ...user, firstName: "Jack" }]);
  });

  it("should do nothing when updating unknown item", () => {
    const user1 = makeUser("1", "John", "Doe");
    const user2 = makeUser("2", "Jack", "Boe");
    const collection = new Collection<User>({
      data: [user1, user2],
      getItemId,
    });
    const subscriber = jest.fn();
    collection.subscribe(subscriber);
    collection.updateItem("unknown id", { firstName: "Jill" });
    expect(subscriber).not.toBeCalled();
  });

  it("should do nothing when updated item wasn't actually changed", () => {
    const user1 = makeUser("1", "John", "Doe");
    const user2 = makeUser("2", "Jack", "Boe");
    const collection = new Collection<User>({
      data: [user1, user2],
      getItemId,
      areItemsEqual(item1, item2) {
        return (
          item1.id === item2.id &&
          item1.firstName === item2.firstName &&
          item1.lastName === item2.lastName
        );
      },
    });
    const subscriber = jest.fn();
    collection.subscribe(subscriber);
    collection.updateItem(user2.id, { firstName: user2.firstName });
    expect(subscriber).not.toBeCalled();
  });

  it("should pass a snapshot to a subscriber when removing item", () => {
    const user1 = makeUser("1", "John", "Doe");
    const user2 = makeUser("2", "Jack", "Boe");
    const collection = new Collection<User>({
      data: [user1, user2],
      getItemId,
    });
    const subscriber = jest.fn();
    collection.subscribe(subscriber);
    collection.removeItem(user1.id);
    expect(subscriber).toBeCalledWith([user2]);
  });

  it("should do nothing when removing unknown item", () => {
    const user1 = makeUser("1", "John", "Doe");
    const user2 = makeUser("2", "Jack", "Boe");
    const collection = new Collection<User>({
      data: [user1, user2],
      getItemId,
    });
    const subscriber = jest.fn();
    collection.subscribe(subscriber);
    collection.removeItem("unknown id");
    expect(subscriber).not.toBeCalled();
  });

  it("should not pass anything to subscriber after removing the subscription", () => {
    const user1 = makeUser("1", "John", "Doe");
    const collection = new Collection<User>({
      data: [user1],
      getItemId,
    });
    const subscriber = jest.fn();
    const subscription = collection.subscribe(subscriber);
    expect(subscriber).toBeCalledTimes(0);
    collection.updateItem("1", { firstName: "Jack" });
    expect(subscriber).toBeCalledTimes(1);
    subscription.remove();
    collection.updateItem("1", { firstName: "Jill" });
    expect(subscriber).toBeCalledTimes(1);
  });

  it("should throw error if item can't be retrieved by id", () => {
    const user1 = makeUser("1", "John", "Doe");
    const collection = new Collection<User>({
      data: [user1],
      getItemId,
    });
    (collection as any).dataIds.push("2");
    expect(() => {
      collection.buildSnapshot();
    }).toThrowError(/not found/);
  });
});
