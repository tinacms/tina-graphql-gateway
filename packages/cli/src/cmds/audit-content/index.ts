import fs from "fs-extra";
import fg from "fast-glob";
import path from "path";
import _ from "lodash";
import { ForestryClient } from "./forestry-client";
import * as jsyaml from "js-yaml";

export const contentAudit = async (_ctx, _next) => {
  await runValidation({
    directory: ".tina",
  });
};

export const runValidation = async ({ directory }: { directory: string }) => {
  const configDirPath = path.resolve(process.cwd(), directory);

  const settingsFullPath = path.join(configDirPath, "settings.yml");
  const settingsJSON = jsyaml.safeLoad(
    await fs.readFileSync(settingsFullPath).toString()
  );
  const sections = settingsJSON.sections;
  const client = new ForestryClient({});
  await Promise.all(
    sections
      .filter(({ type }) => type === "directory")
      .map(async (section) => {
        // build query

        const options = section.exclude ? { ignore: section.exclude } : {};
        const files = await fg(`${section.path}/${section.match}`, options);
        await Promise.all(
          files.map(async (file) => {
            try {
              const response = await client.getContent({
                path: file,
              });

              try {
                await client.updateContent({
                  path: file,
                  payload: response,
                });
              } catch (e) {
                console.log(`Unable to update ${file}`, e.message);
              }
            } catch (e) {
              console.log(`Unable to fetch ${file}`, e.message);
            }
          })
        );
      })
  );
  return "hello";
};
