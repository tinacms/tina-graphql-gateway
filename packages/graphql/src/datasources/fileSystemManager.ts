import fs from "fs";
import matterOrig, { Input, GrayMatterOption } from "gray-matter";
import type { DataSource, Settings, FMT, Section } from "./datasource";
import path from "path";
import * as jsyaml from "js-yaml";
import { getSectionFmts } from "../util";
import { stripIgnoredCharacters } from "graphql";
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

  getSectionTemplates = async (_siteLookup: string) => {
    const settings = await this.getSettings(_siteLookup);
    const sectionFmtNames = getSectionFmts(settings.data.sections);
    const sectionTemplates = ([] as string[]).concat(
      ...sectionFmtNames.map((section) => section.templates + ".yml")
    );
    return sectionTemplates.map(async (templateName: string) => {
      return {
        name: templateName,
        fmt: await this.getTemplate(_siteLookup, templateName),
      };
    });
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

  fileExists = async (fullPath: string): Promise<boolean> => {
    return fs.promises
      .access(fullPath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
  };

  deleteData = async (filePath: string) => {
    const fullPath = this.getFullPath(filePath);

    if (!(await this.fileExists(fullPath)))
      throw new Error(`Cannot delete ${fullPath}: Does not exist.`);
    fs.unlinkSync(fullPath);

    return !(await this.fileExists(fullPath));
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

  deleteContent = async (_siteLookup: string, filePath: string) => {
    // deletes the file
    await this.deleteData(filePath);

    // deletes references from pages arrays
    const templates = await this.getSectionTemplates(_siteLookup);
    Promise.all(templates).then((resolved) => {
      resolved.map(async (template) => {
        template.fmt.data.pages = template.fmt.data.pages.filter(
          (page: string) => page !== filePath
        );
        await this.writeTemplate(_siteLookup, template.name, template.fmt);
      });
    });
    return Promise.resolve(true);
  };

  getTemplateList = async (_siteLookup: string) => {
    const list = await fs.readdirSync(this.getFullPath(FMT_BASE));

    return list;
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
