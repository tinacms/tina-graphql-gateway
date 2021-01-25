/**
Copyright 2021 Forestry.io Inc
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import fs from "fs";
import path from "path";
import { cacheInit } from "../cache";
import { schemaBuilder } from ".";
import { FileSystemManager } from "../datasources/filesystem-manager";
import { parse, printSchema, buildASTSchema } from "graphql";

describe("Schema builder", () => {
  test("does it", async () => {
    const fixtures: string[] = await fs.readdirSync(
      path.join(process.cwd(), "src/fixtures")
    );

    await Promise.all(
      fixtures
        .filter((f) => f !== ".DS_Store")
        .map(async (f) => {
          const projectRoot = path.join(process.cwd(), `src/fixtures/${f}`);
          const datasource = new FileSystemManager(projectRoot);
          const cache = cacheInit(datasource);
          const { schema } = await schemaBuilder({ cache });

          const schemaString = printSchema(buildASTSchema(schema));

          // await fs
          //   .writeFileSync(path.join(projectRoot, "ast-schema.graphql"), schemaString)

          const schemaFile = await fs
            .readFileSync(path.join(projectRoot, "ast-schema.graphql"))
            .toString();

          expect(parse(schemaFile)).toMatchObject(schema);
        })
    );
  });
});
