import fs from "fs";
import matterOrig, { Input, GrayMatterOption } from "gray-matter";

export const stringify = (content: string, data: object) => {
  return matterOrig.stringify(content, data, {
    // @ts-ignore
    lineWidth: -1,
    noArrayIndent: true,
  });
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

export const writeData = async (path: string, content: any, data: any) => {
  const string = stringify(content, data);
  await fs.writeFileSync(path, string);

  return await getData(path);
};
