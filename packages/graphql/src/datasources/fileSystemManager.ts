import fs from "fs";
import matterOrig, { Input, GrayMatterOption } from "gray-matter";
import { DataSource, Settings, FMT } from "./datasource";
import path from "path";

const FMT_BASE = ".forestry/front_matter/templates";
const SETTINGS_PATH = ".forestry/settings.yml";

export class FileSystemManager implements DataSource {
  rootPath: string;
  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }
  getTemplate = async (
    _siteLookup: string,
    templateName: string
  ): Promise<FMT> => {
    return this.getData<FMT>(_siteLookup, FMT_BASE + "/" + templateName);
  };
  getSettings = async (_siteLookup: string): Promise<Settings> => {
    return this.getData<Settings>(_siteLookup, SETTINGS_PATH);
  };
  getData = async <T>(_siteLookup: string, relPath: string): Promise<T> => {
    const result = matter(await fs.readFileSync(this.getFullPath(relPath)));
    // @ts-ignore
    return result;
  };
  writeData = async <T>(
    _siteLookup: string,
    filepath: string,
    content: any,
    data: any
  ) => {
    const string = stringify(content, data);

    const fullPath = this.getFullPath(filepath);
    await fs.writeFileSync(fullPath, string);

    return await this.getData<T>(_siteLookup, filepath);
  };
  getTemplateList = async (_siteLookup: string) => {
    const list = await fs.readdirSync(this.getFullPath(FMT_BASE));

    return list;
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
