/**
Copyright 2021 Forestry.io Holdings, Inc.
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

import { indexDB } from './build'
import { resolve } from './resolve'
import fs from 'fs-extra'
import path from 'path'
import type { Database } from './database'
import { print, buildASTSchema, printSchema } from 'graphql'

export { createDatabase } from './database'
export { indexDB, resolve }

export type { TinaCloudSchema } from './types'

export const gql = async ({
  projectRoot,
  query,
  variables,
  database,
}: {
  projectRoot: string
  query: string
  variables: object
  database: Database
}) => {
  const config = await fs
    .readFileSync(
      path.join(projectRoot, '.tina', '__generated__', 'config', 'schema.json')
    )
    .toString()
  await indexDB({
    database,
    config: JSON.parse(config),
  })
  const gqlAst = await database.get('_graphql')
  // @ts-ignore
  const schemaString = printSchema(buildASTSchema(gqlAst))

  await fs.writeFileSync(
    path.join(projectRoot, '.tina', '__generated__', 'schema.gql'),
    schemaString
  )
  return resolve({
    rootPath: projectRoot,
    database,
    query,
    variables,
  })
}

export const buildSchema = async (rootPath: string, database: Database) => {
  const config = await fs
    .readFileSync(
      path.join(rootPath, '.tina', '__generated__', 'config', 'schema.json')
    )
    .toString()
  await indexDB({ database, config: JSON.parse(config) })
  const gqlAst = await database.get('_graphql')
  // @ts-ignore
  return buildASTSchema(gqlAst)
}
