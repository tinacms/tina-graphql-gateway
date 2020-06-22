import fs from "fs";
import { matter } from "../util";

export interface DataSource {
  getData<T>(filepath: string): Promise<T>;
}

export class FileSystemManager implements DataSource {
  getData = async <T>(filepath: string): Promise<T> => {
    const result = matter(await fs.readFileSync(filepath));

    // @ts-ignore
    return result;
  };
}
