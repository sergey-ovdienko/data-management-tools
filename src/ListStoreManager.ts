export interface ListStoreManager<T> {
  getData(): Promise<T[]>;
  setData(data: T[]): Promise<void>;
  addItem(item: T): Promise<void>;
  updateItem(item: T): Promise<void>;
  deleteItem(itemId: string): Promise<void>;
}
