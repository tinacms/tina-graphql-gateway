import type {
  DataSource,
  Settings,
  FMT,
  FieldType,
  Content,
} from "@forestryio/graphql";
import { Client as ElasticClient } from "@elastic/elasticsearch";
import path from "path";
const templateMapping: { [key: string]: string } = {
  "0": "boolean",
  "1": "field_group_list",
  "2": "tag_list",
  "3": "file",
  "4": "datetime",
  "5": "textarea",
  "6": "text",
  "7": "field_group",
  "8": "list",
  "9": "select",
  "10": "image_gallery",
  "11": "number",
  "12": "", //include
  "13": "blocks",
  "14": "", //color
};

const mapFields = (fields: FieldType[]): FieldType[] => {
  if (!fields.length) {
    return [];
  }

  return fields.map((field: any) => {
    return {
      ...field,
      type: templateMapping[field.type],
      fields: mapFields(field.fields),
    };
  });
};

export class ElasticManager implements DataSource {
  elasticClient: ElasticClient;
  constructor() {
    this.elasticClient = new ElasticClient({ node: "http://localhost:9200" });
  }
  getTemplate = async (siteLookup: string, name: string): Promise<FMT> => {
    const result = await this.elasticClient.get({
      index: "project-templates",
      id: name,
    });
    const fmt = result.body._source;

    return {
      data: { ...fmt, filename: name, pages: fmt.pages || [] },
    };
  };

  getSettings = async (siteLookup: string): Promise<Settings> => {
    const result = await this.elasticClient.get({
      index: "project-settings",
      id: "settings.yml",
    });
    const siteSettings = result.body._source;

    // @ts-ignore
    return {
      data: siteSettings,
    };
  };

  getData = async <T extends Content>(
    siteLookup: string,
    filepath: string
  ): Promise<T> => {
    //TODO - we should be storing paths as relative and not absolute
    const file = path
      .join(process.env.REPO_ROOT || "", filepath)
      .split("/")
      .join("$");

    const result = await this.elasticClient.get({
      index: "project",
      id: file,
    });
    const { data, content } = result.body._source;

    // @ts-ignore
    return {
      data,
      content,
    } as T;
  };

  writeData = async <T extends Content>(
    siteLookup: string,
    filepath: string,
    content: any,
    data: any
  ) => {
    const file = path
      .join(process.env.REPO_ROOT || "", filepath)
      .split("/")
      .join("$");

    console.log("will update", content, data, file);
    const result = await this.elasticClient.update({
      index: "project",
      id: file,
      body: {
        doc: {
          data,
          content,
        },
      },
    });

    return this.getData<T>(siteLookup, filepath);
  };
  getTemplateList = async (siteLookup: string): Promise<string[]> => {
    const result = await this.elasticClient.search({
      index: "project-templates",
      size: 100,
      body: {
        query: {
          match_all: {},
        },
      },
    });

    return result.body.hits.hits.map((template: any) => {
      return template._id;
    });
  };
}
