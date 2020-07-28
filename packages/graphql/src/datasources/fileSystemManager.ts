import fs from "fs";
import matterOrig, { Input, GrayMatterOption } from "gray-matter";
import type { DataSource, Settings, FMT } from "./datasource";
import path from "path";
import * as jsyaml from "js-yaml";
const FMT_BASE = ".forestry/front_matter/templates";
const SETTINGS_PATH = ".forestry/settings.yml";
import DataLoader from "dataloader";

export class FileSystemManager implements DataSource {
  rootPath: string;
  dataLoader: DataLoader<any, any>;
  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.dataLoader = new DataLoader(this.batchTemplates);
  }
  getTemplate = async (
    _siteLookup: string,
    templateName: string
  ): Promise<FMT> => {
    return this.dataLoader.load(FMT_BASE + "/" + templateName);
  };
  getSettings = async (_siteLookup: string): Promise<Settings> => {
    return this.getData<Settings>(_siteLookup, SETTINGS_PATH);
  };
  getData = async <T>(_siteLookup: string, relPath: string): Promise<T> => {
    const result = matter(await fs.readFileSync(this.getFullPath(relPath)));
    // @ts-ignore
    return result;
  };
  writeData = async <ContentType>(
    _siteLookup: string,
    filepath: string,
    content: string,
    data: Partial<ContentType>
  ) => {
    const string = stringify(content, data);

    const fullPath = this.getFullPath(filepath);
    await fs.writeFileSync(fullPath, string);

    return await this.getData<ContentType>(_siteLookup, filepath);
  };

  createContent = async <ContentType>(
    _siteLookup: string,
    filepath: string,
    content: string,
    data: Partial<ContentType>,
    templateName: string
  ) => {
    const newContent = await this.writeData<ContentType>(
      _siteLookup,
      filepath,
      content,
      data
    );

    let template = await this.getTemplate(_siteLookup, templateName);

    template.data.pages.push(filepath.replace(/^\/+/, ""));
    await this.writeTemplate(_siteLookup, templateName, template);
    return newContent;
  };
  getTemplateList = async (_siteLookup: string) => {
    const list = await fs.readdirSync(this.getFullPath(FMT_BASE));

    return list;
  };

  private _getTemplate = async (
    _siteLookup: string,
    templateName: string
  ): Promise<FMT> => {
    return this.getData<FMT>(_siteLookup, templateName);
  };

  private writeTemplate = async (
    _siteLookup: string,
    templateName: string,
    template: FMT
  ): Promise<void> => {
    const string = "---\n" + jsyaml.dump(template.data);
    await fs.writeFileSync(FMT_BASE + "/" + templateName, string);
  };

  private getFullPath(relPath: string) {
    return path.join(this.rootPath, relPath);
  }

  private formatBatchedResult = (
    templates: (FMT & { path: string })[],
    ids: readonly string[]
  ) => {
    const templateMap: { [key: string]: any } = {};
    templates.forEach((template) => {
      templateMap[template.path] = template;
    });

    return ids.map((id) => templateMap[id]);
  };

  private batchTemplates = async (
    templateIds: readonly string[]
  ): Promise<(FMT & { path: string })[][]> => {
    try {
      const templates = await Promise.all(
        //TODO - if datasource supports it, we can do a batch operation here
        templateIds.map(async (templateId) => {
          const template = await this._getTemplate("", templateId);
          return {
            ...template,
            path: templateId,
          };
        })
      );
      return this.formatBatchedResult(templates, templateIds);
    } catch (err) {
      throw new Error("There was an issue loading the templates.");
    }
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
