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

import _ from 'lodash'
import * as yup from 'yup'
import matter from 'gray-matter'
import path from 'path'
import { NAMER } from '../ast-builder'
import { Bridge, FilesystemBridge } from './bridge'
import { createSchema } from '../schema'
import { assertShape, lastItem } from '../util'

import type { TinaSchema } from '../schema'
import type { TinaCloudSchemaBase } from '../types'

type CreateDatabase = { rootPath: string; bridge?: Bridge }

export const createDatabase = async (config: CreateDatabase) => {
  return new Database(config)
}

const SYSTEM_FILES = ['_schema', '_graphql', '_lookup']
const GENERATED_FOLDER = path.join('.tina', '__generated__')

export class Database {
  public bridge: Bridge
  public rootPath: string
  private tinaShema: TinaSchema | undefined
  constructor(public config: CreateDatabase) {
    this.bridge = config.bridge || new FilesystemBridge(config.rootPath)
    this.rootPath = config.rootPath
  }

  public get = async <T extends object>(filepath: string): Promise<T> => {
    if (SYSTEM_FILES.includes(filepath)) {
      const dataString = await this.bridge.get(
        path.join(GENERATED_FOLDER, `${filepath}.json`)
      )
      return JSON.parse(dataString)
    } else {
      const tinaSchema = await this.getSchema()
      const extension = path.extname(filepath)
      const contentString = await this.bridge.get(filepath)
      const contentObject = this.parseFile<{ _template?: string }>(
        contentString,
        extension,
        (yup) => yup.object({})
      )
      const { collection, template } =
        await tinaSchema.getCollectionAndTemplateByFullPath(
          filepath,
          contentObject._template
        )
      return {
        ...contentObject,
        _collection: collection.name,
        _template: lastItem(template.namespace),
        _relativePath: filepath
          .replace(collection.path, '')
          .replace(/^\/|\/$/g, ''),
        _id: filepath,
      } as T
    }
  }

  public put = async (filepath: string, data: object) => {
    if (SYSTEM_FILES.includes(filepath)) {
      await this.bridge.put(
        path.join(GENERATED_FOLDER, `${filepath}.json`),
        JSON.stringify(data, null, 2)
      )
    } else {
      const tinaSchema = await this.getSchema()
      const collection = await tinaSchema.getCollectionByFullPath(filepath)

      const templateInfo = await tinaSchema.getTemplatesForCollectable(
        collection
      )
      const extension = path.extname(filepath)
      const stringData = this.stringifyFile(
        data,
        extension,
        templateInfo.type === 'union'
      )
      await this.bridge.put(filepath, stringData)
    }
    return true
  }

  public getLookup = async (returnType: string): Promise<LookupMapType> => {
    const lookup = await this.get<{ [returnType: string]: LookupMapType }>(
      '_lookup'
    )
    return lookup[returnType]
  }

  public getDocument = async (fullPath: unknown) => {
    if (typeof fullPath !== 'string') {
      throw new Error(`fullPath must be of type string for getDocument request`)
    }
    const data = await this.get<{
      _collection: string
      _template: string
    }>(fullPath)
    return {
      __typename: NAMER.documentTypeName([data._collection]),
      id: fullPath,
      data,
    }
  }

  public getDocumentsForCollection = async (collectionName: string) => {
    const tinaSchema = await this.getSchema()
    const collection = await tinaSchema.getCollection(collectionName)
    return this.bridge.glob(collection.path)
  }

  public addToLookupMap = async (lookup: LookupMapType) => {
    let lookupMap
    try {
      lookupMap = await this.get('_lookup')
    } catch (e) {
      lookupMap = {}
    }
    await this.put('_lookup', { ...lookupMap, [lookup.type]: lookup })
  }

  private getSchema = async () => {
    if (this.tinaShema) {
      return this.tinaShema
    }
    const schema = await this.get<TinaCloudSchemaBase>('_schema')
    this.tinaShema = await createSchema({ schema })
    return this.tinaShema
  }

  private stringifyFile = (
    content: object,
    format: FormatType | string, // FIXME
    /** For non-polymorphic documents we don't need the template key */
    keepTemplateKey: boolean
  ): string => {
    switch (format) {
      case '.markdown':
      case '.md':
        // @ts-ignore
        const { _id, _template, _collection, body, ...rest } = content
        const extra: { [key: string]: string } = {}
        if (keepTemplateKey) {
          extra['_template'] = _template
        }
        return matter.stringify(body || '', { ...rest, ...extra })
      default:
        throw new Error(`Must specify a valid format, got ${format}`)
    }
  }

  private parseFile = <T extends object>(
    content: string,
    format: FormatType | string, // FIXME
    yupSchema: (args: typeof yup) => yup.ObjectSchema<any>
  ): T => {
    switch (format) {
      case '.markdown':
      case '.md':
        const contentJSON = matter(content || '')
        const markdownData = { ...contentJSON.data, _body: contentJSON.content }
        assertShape<T>(markdownData, yupSchema)
        return markdownData
      case '.json':
        if (!content) {
          return {} as T
        }
        return JSON.parse(content)
      default:
        throw new Error(`Must specify a valid format, got ${format}`)
    }
  }
}

type FormatType = 'json' | 'md' | 'markdown' | 'yml' | 'yaml'

export type LookupMapType =
  | GlobalDocumentLookup
  | CollectionDocumentLookup
  | MultiCollectionDocumentLookup
  | MultiCollectionDocumentListLookup
  | CollectionDocumentListLookup
  | UnionDataLookup
  | NodeDocument

type NodeDocument = {
  type: string
  resolveType: 'nodeDocument'
}
type GlobalDocumentLookup = {
  type: string
  resolveType: 'globalDocument'
  collection: string
}
type CollectionDocumentLookup = {
  type: string
  resolveType: 'collectionDocument'
  collection: string
}
type MultiCollectionDocumentLookup = {
  type: string
  resolveType: 'multiCollectionDocument'
}
type MultiCollectionDocumentListLookup = {
  type: string
  resolveType: 'multiCollectionDocumentList'
  collections: string[]
}
export type CollectionDocumentListLookup = {
  type: string
  resolveType: 'collectionDocumentList'
  collection: string
}
type UnionDataLookup = {
  type: string
  resolveType: 'unionData'
  typeMap: { [templateName: string]: string }
}
