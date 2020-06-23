import fs from "fs";
import matterOrig, { Input, GrayMatterOption } from "gray-matter";
import { DataSource } from "./datasource";
import { Client, QueryResult } from "pg";

const dummySiteId = 7;

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

interface Field {
  type: string;
  fields: Field[];
}

const mapFields = (fields: any[]): Field[] => {
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

export class DatabaseManager implements DataSource {
  client: Client;
  constructor() {
    this.client = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DATABASE,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || "5432"),
    });
    this.client.connect();
  }
  getTemplate = async <T>(name: string): Promise<T> => {
    const templatesRes = await this.query(
      `SELECT * from Page_Types WHERE site_id = ${dummySiteId} AND filename = '${name}'`
    );

    const template = templatesRes.rows[0];

    const pagesRes = await this.query(
      `SELECT path from Pages WHERE page_type_id = ${template.id}`
    );

    return {
      data: {
        ...template,
        label: template.name,
        fields: mapFields(template.fields),
        pages: pagesRes.rows.map((p) => p.path),
      },
    } as any;
  };

  getSettings = async (): Promise<any> => {
    const siteRes = await this.query(
      `SELECT * from Sites WHERE id = ${dummySiteId}`
    );

    const site = siteRes.rows[0];
    const sectionsRes = await this.query(
      `SELECT * from Sections WHERE site_id = ${site.id}`
    );

    return {
      data: {
        ...site,
        sections: sectionsRes.rows.map(({ directory, ...section }: any) => {
          return {
            ...section,
            path: directory,
            type:
              section.type === "DirectorySection" ? "directory" : section.type,
          };
        }),
      },
    };
  };

  getData = async <T>(filepath: string): Promise<T> => {
    const res = await this.query(
      `SELECT * from Pages WHERE site_id = ${dummySiteId} AND path = '${filepath}'`
    );
    return {
      data: res.rows[0],
    } as any;
  };

  writeData = async <T>(path: string, content: any, data: any) => {
    const string = stringify(content, data);
    await fs.writeFileSync(path, string);

    return await this.getData<T>(path);
  };
  getTemplateList = async (): Promise<string[]> => {
    const res = await this.query(
      `SELECT * from Page_types WHERE site_id = ${dummySiteId}`
    );
    return res.rows.filter((row) => row.filename).map((row) => row.filename);
  };

  private query = <T = any>(query: string): Promise<QueryResult<T>> => {
    return new Promise((resolve, reject) => {
      this.client.query(query, (err: Error, res: QueryResult<T>) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  };
}

const stringify = (content: string, data: object) => {
  return matterOrig.stringify(content, data, {
    // @ts-ignore
    lineWidth: -1,
    noArrayIndent: true,
  });
};
