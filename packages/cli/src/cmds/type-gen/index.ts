import { successText } from "../../utils/theme";
import { generateTypes } from "../../codegen";
import { print } from "graphql";

import {
  buildSchema as buildForestrySchema,
  FileSystemManager,
} from "@forestryio/graphql";
import path from "path";
import fs from "fs";

export async function genTypes() {
  const configPath = path.resolve(process.cwd() + "/.forestry/config.js");
  const userConfig = require(configPath);

  const config = {
    rootPath: process.cwd(),
    ...userConfig,
  };
  const dataSource = new FileSystemManager(config.rootPath);

  const { schema } = await buildForestrySchema(config, dataSource);

  const { typescriptTypes, query: gQuery } = await generateTypes({ schema });

  const typesPath = process.cwd() + "/.forestry/types.ts";
  const queriesPath = process.cwd() + "/.forestry/query.ts";

  await fs.writeFileSync(
    typesPath,
    `// DO NOT MODIFY THIS FILE. This file is automatically generated by Forestry
${typescriptTypes}
`
  );
  console.log("Generated types at" + successText(` ${typesPath}`));

  await fs.writeFileSync(
    process.cwd() + "/.forestry/query.ts",
    `// DO NOT MODIFY THIS FILE. This file is automatically generated by Forestry
export default \`${print(gQuery)}\`
`
  );

  console.log("Generated queries at " + successText(` ${queriesPath}`));
}
