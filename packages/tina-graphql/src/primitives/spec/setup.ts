import { indexDB } from '../build'
import { resolve } from '../resolve'
import fs from 'fs-extra'
import { buildASTSchema, printSchema, parse } from 'graphql'
import path from 'path'
import fg from 'fast-glob'

import type { TinaCloudSchema } from '../types'
import { createDatabase } from '../database'
import { Database } from '../database'
import { Bridge } from '../database/bridge'
import { sequential } from '../util'

export class InMemoryBridge implements Bridge {
  public rootPath: string
  private mockFileSystem: { [filepath: string]: string } | undefined
  constructor(rootPath: string) {
    this.rootPath = rootPath
  }
  public glob = async (pattern: string) => {
    const items = await fg(path.join(this.rootPath, pattern, '**/*'), {
      dot: true,
    })
    return items.map((item) => {
      return item.replace(this.rootPath, '')
    })
  }
  public get = async (filepath: string) => {
    const mockData = await this.getMockData()
    return mockData[filepath]
  }
  public put = async (filepath: string, data: string) => {
    const mockData = await this.getMockData()
    this.mockFileSystem = { ...mockData, [filepath]: data }
  }

  public getMockData = async () => {
    if (!this.mockFileSystem) {
      const files = await this.glob('content')
      const mockFileSystem: { [filename: string]: string } = {}
      await sequential(files, async (file) => {
        const data = await fs
          .readFileSync(path.join(this.rootPath, file))
          .toString()
        mockFileSystem[file] = data
        return true
      })
      this.mockFileSystem = mockFileSystem
    }
    return this.mockFileSystem
  }
}

export const setup = async (
  rootPath: string,
  schema: TinaCloudSchema<string, string, false>,
  updateSnapshot?: boolean
): Promise<{
  database: Database
  schemaString: string
  expectedSchemaString: string
}> => {
  const bridge = new InMemoryBridge(rootPath)
  await bridge.getMockData()
  const database = await createDatabase({
    rootPath,
    bridge,
  })
  await indexDB({ database, config: schema })
  const schemaString = await database.get('_graphql')
  // @ts-ignore
  const graphQLSchemaString = printSchema(buildASTSchema(schemaString))
  await fs.outputFileSync(
    path.join(rootPath, '.tina', '__generated__', 'schema.gql'),
    graphQLSchemaString
  )

  return {
    database,
    schemaString: 'hi',
    expectedSchemaString: 'hi',
    // schemaString: formattedSchemaString,
    // expectedSchemaString,
  }
}

export const setupFixture = async (
  rootPath: string,
  schema: TinaCloudSchema<string, string, false>,
  fixture: string
) => {
  const { database } = await setup(rootPath, schema)
  const request = await fs
    .readFileSync(path.join(rootPath, 'requests', fixture, 'request.gql'))
    .toString()
  const expectedReponse = await fs
    .readFileSync(path.join(rootPath, 'requests', fixture, 'response.json'))
    .toString()
  const response = await resolve({
    rootPath,
    query: request,
    variables: {},
    database,
  })
  if (response.errors) {
    console.log(response.errors)
  }
  return { response, expectedReponse }
}
