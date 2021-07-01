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

import { indexDB } from '../build'
import { resolve } from '../resolve'
import fs from 'fs-extra'
import { buildASTSchema, printSchema, parse, DocumentNode } from 'graphql'
import path from 'path'
import fg from 'fast-glob'

import type { TinaCloudSchema } from '../types'
import { createDatabase } from '../database'
import { Database } from '../database'
import { Bridge } from '../database/bridge'
import { sequential } from '../util'
import { splitQuery2, splitQuery } from 'tina-graphql-helpers'

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
    const value = mockData[filepath]
    if (!value) {
      throw new Error(`Unable to find record for ${filepath}`)
    }
    return value
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
  // console.log(JSON.stringify(response, null, 2))

  return {
    response,
    expectedReponse,
  }
}

export const setupAudit = async (
  rootPath: string,
  schema: TinaCloudSchema<string, string, false>,
  fixture: { filepath: string; result: string }
) => {
  const { database } = await setup(rootPath, schema)
  const document = await database.get(fixture.filepath)

  // @ts-ignore
  const request = transformDocumentIntoMutationRequestPayload(document, true)
  const expectedRequest = await fs
    .readFileSync(path.join(rootPath, 'audits', `${fixture.result}.gql`))
    .toString()
  return { request, expectedRequest }
}

const transformDocumentIntoMutationRequestPayload = (
  document: {
    _id: string
    _collection: string
    _template: string
    [key: string]: unknown
  },
  includeCollection?: boolean
) => {
  const { _id, _relativePath, _collection, ...rest } = document

  const params1 = transformParams(rest)

  const params = includeCollection ? { [_collection]: params1 } : params1

  const payload: { [key: string]: unknown } = {
    params,
    relativePath: _relativePath,
  }
  if (includeCollection) {
    payload['collection'] = _collection
  }

  return payload
}

const transformParams = (data: { _template?: string }) => {
  if (data._template) {
    const { _template, ...rest } = data
    return { [_template]: rest }
  } else {
    return data
  }
}
