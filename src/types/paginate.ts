export interface Paginate<T> {
  __typename?: string;
  elements: T[];
  total: number;
}
