export interface DataSource {
  getData<T>(filepath: string): Promise<T>;
  writeData<T>(path: string, content: any, data: any): Promise<T>;
  getDirectoryList(path: string): Promise<string[]>;
}
