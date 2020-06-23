import fs from "fs";
import matterOrig, { Input, GrayMatterOption } from "gray-matter";
import { DataSource } from "./datasource";
import { Client } from "pg";

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
  getData = async <T>(filepath: string): Promise<T> => {
    this.client.query(
      `SELECT * from Pages WHERE path = '${filepath}'`,
      (err, res) => {
        console.log("filepath::", filepath);
        console.log(err, res);
      }
    );
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
