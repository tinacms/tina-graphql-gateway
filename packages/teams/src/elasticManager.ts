import type {
  DataSource,
  Settings,
  FMT,
  FieldType,
  Content,
} from "@forestryio/graphql";
import { Client, QueryResult } from "pg";
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

export class ElasticManager implements DataSource {
  client: Client;
  elasticClient: ElasticClient;
  constructor() {
    this.client = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DATABASE,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || "5432"),
    });
    this.elasticClient = new ElasticClient({ node: "http://localhost:9200" });
    this.client.connect();
  }
  getTemplate = async (siteLookup: string, name: string): Promise<FMT> => {
    const templatesRes = await this.query<DB_FMT>(
      `SELECT Page_Types.*, Sites.lookup from Page_Types ` +
        `INNER JOIN Sites ON (Sites.id = Page_Types.site_id) ` +
        `WHERE Sites.lookup = '${siteLookup}' AND filename = '${name}'`
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

  getSettings = async (siteLookup: string): Promise<Settings> => {
    const siteRes = await this.query<DB_Site>(
      `SELECT * from Sites WHERE lookup = '${siteLookup}'`
    );

    const site = siteRes.rows[0];
    const sectionsRes = await this.query<DB_SECTION>(
      `SELECT Sections.*, Sites.lookup from Sections ` +
        `INNER JOIN Sites ON (Sites.id = Sections.site_id) ` +
        `WHERE Sites.lookup = '${siteLookup}'`
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
    path: string,
    content: any,
    data: any
  ) => {
    await this.query(
      `UPDATE Pages ` +
        `SET params = '${JSON.stringify(data)}', body = '${content || ""}' ` +
        `FROM Sites ` +
        `WHERE Sites.lookup = '${siteLookup}' AND path = '${path}'`
    );

    return this.getData<T>(siteLookup, path);
  };
  getTemplateList = async (siteLookup: string): Promise<string[]> => {
    const res = await this.query<DB_FMT>(
      `SELECT Page_types.*, Sites.lookup from Page_types ` +
        `INNER JOIN Sites ON (Sites.id = Page_types.site_id) ` +
        `WHERE Sites.lookup = '${siteLookup}'`
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
