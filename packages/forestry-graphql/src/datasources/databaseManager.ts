import { DataSource, Settings, FMT, FieldType, Content } from "./datasource";
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

interface DB_SECTION {
  type: "DocumentSection" | "DirectorySection" | "HeadingSection";
  directory: string;
  templates: string[];
  params: any;
}

interface DB_FMT {
  id: string;
  name: string;
  slug: string;
  fields: any[];
  hide_body: boolean;
  is_partial: boolean;
  filename: string;
  display_field: boolean;
}

interface DB_Site {
  id: string;
}

interface DB_Page {
  params: any;
  body: string;
  slug: string;
  path: string;
}

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
  getTemplate = async (name: string): Promise<FMT> => {
    const templatesRes = await this.query<DB_FMT>(
      `SELECT * from Page_Types WHERE site_id = ${dummySiteId} AND filename = '${name}'`
    );

    const template = templatesRes.rows[0];

    const pagesRes = await this.query<DB_Page>(
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

  getSettings = async (): Promise<Settings> => {
    const siteRes = await this.query<DB_Site>(
      `SELECT * from Sites WHERE id = ${dummySiteId}`
    );

    const site = siteRes.rows[0];
    const sectionsRes = await this.query<DB_SECTION>(
      `SELECT * from Sections WHERE site_id = ${site.id}`
    );

    return {
      data: {
        ...site,
        sections: sectionsRes.rows.map(({ directory, ...section }) => {
          return {
            ...section,
            ...section.params,
            path: directory,
            type:
              section.type === "DirectorySection" ? "directory" : section.type,
          };
        }),
      },
    };
  };

  getData = async <T extends Content>(filepath: string): Promise<T> => {
    const res = await this.query<DB_Page>(
      `SELECT * from Pages WHERE site_id = ${dummySiteId} AND path = '${filepath}'`
    );

    const data = res.rows[0];
    return {
      data: data.params,
      content: data.body,
    } as T;
  };

  writeData = async <T extends Content>(
    path: string,
    content: any,
    data: any
  ) => {
    await this.query(
      `UPDATE Pages SET params = '${JSON.stringify(data)}', body = '${
        content || ""
      }' WHERE site_id = ${dummySiteId} AND path = '${path}'`
    );

    return this.getData<T>(path);
  };
  getTemplateList = async (): Promise<string[]> => {
    const res = await this.query<DB_FMT>(
      `SELECT * from Page_types WHERE site_id = ${dummySiteId}`
    );
    return res.rows.filter((row) => row.filename).map((row) => row.filename);
  };

  private query = <T = any>(query: string): Promise<QueryResult<T>> => {
    return new Promise((resolve, reject) => {
      this.client.query<T>(query, (err: Error, res: QueryResult<T>) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  };
}
