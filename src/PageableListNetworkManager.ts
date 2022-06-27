import { ListNetworkManager } from './ListNetworkManager';

export interface PageableListNetworkManager<T, P>
  extends ListNetworkManager<T> {
  getDataBefore(predicate: P, size: number): Promise<T[]>;
}
