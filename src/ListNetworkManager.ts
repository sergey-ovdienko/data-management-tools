export interface ListNetworkManager<T> {
  getData(): Promise<T[]>;
}
