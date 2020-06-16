import fs from "fs";
import matterOrig, { Input, GrayMatterOption } from "gray-matter";

export const stringify = (content: string, data: object) => {
  return matterOrig.stringify(content, data);
};

export const matter = <I extends Input, O extends GrayMatterOption<I, O>>(
  data: Buffer
) => {
  let res;
  res = matterOrig(data, { excerpt_separator: "<!-- excerpt -->" });

  return res;
};

export const getDirectoryList = async (path: any) => {
  const list = await fs.readdirSync(path);

  return list.map((item) => `${path}/${item}`);
};

export const getData = async <T>(filepath: string): Promise<T> => {
  const result = matter(await fs.readFileSync(filepath));

  // @ts-ignore
  return result;
};
