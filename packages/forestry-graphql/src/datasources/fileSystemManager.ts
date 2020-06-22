import fs from "fs";
import matterOrig, { Input, GrayMatterOption } from "gray-matter";

export interface DataSource {
  getData<T>(filepath: string): Promise<T>;
  writeData<T>(path: string, content: any, data: any): Promise<T>;
  getDirectoryList(path: string): Promise<string[]>;
}

export class FileSystemManager implements DataSource {
  getData = async <T>(filepath: string): Promise<T> => {
    const result = matter(await fs.readFileSync(filepath));

    // @ts-ignore
    return result;
  };
  writeData = async <T>(path: string, content: any, data: any) => {
    const string = stringify(content, data);
    await fs.writeFileSync(path, string);

    return await this.getData<T>(path);
  };
  getDirectoryList = async (path: any) => {
    const list = await fs.readdirSync(path);

    return list.map((item) => `${path}/${item}`);
  };
}

const stringify = (content: string, data: object) => {
  return matterOrig.stringify(content, data, {
    // @ts-ignore
    lineWidth: -1,
    noArrayIndent: true,
  });
};

const matter = <I extends Input, O extends GrayMatterOption<I, O>>(
  data: Buffer
) => {
  let res;
  res = matterOrig(data, { excerpt_separator: "<!-- excerpt -->" });

  return res;
};
