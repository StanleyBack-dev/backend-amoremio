export interface UnitOfWorkPort {
  executeInTransaction<T>(callback: () => Promise<T>): Promise<T>;
}
