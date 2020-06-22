import fs from "fs";
import matterOrig, { Input, GrayMatterOption } from "gray-matter";
import { DataSource } from "./datasource";
import path from "path";

export class FileSystemManager implements DataSource {
  rootPath: string;
  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }
  getData = async <T>(filepath: string): Promise<T> => {
    const result = matter(await fs.readFileSync(this.getFullPath(filepath)));

    // @ts-ignore
    return result;
  };
  writeData = async <T>(filepath: string, content: any, data: any) => {
    const string = stringify(content, data);

    const fullPath = this.getFullPath(filepath);
    await fs.writeFileSync(fullPath, string);

    return await this.getData<T>(fullPath);
  };
  getDirectoryList = async (filepath: any) => {
    const list = await fs.readdirSync(this.getFullPath(filepath));

    return list.map((item) => `${filepath}/${item}`);
  };

  private getFullPath(relPath: string) {
    return path.join(this.rootPath, relPath);
  }
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
