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
