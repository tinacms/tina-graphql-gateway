import _ from 'lodash'
import { graphql, buildASTSchema, getNamedType } from 'graphql'
import { createSchema } from './schema'
import { createResolver } from './resolver'
import { assertShape } from './util'

import type { GraphQLResolveInfo, DocumentNode } from 'graphql'
import type { Database } from './database'
import type { TinaCloudSchemaBase } from './types'

export const resolve = async ({
  query,
  variables,
  database,
  rootPath,
}: {
  rootPath: string
  query: string
  variables: object
  database: Database
}) => {
  const graphQLSchemaAst = await database.get<DocumentNode>('_graphql')
  const graphQLSchema = buildASTSchema(graphQLSchemaAst)

  const config = (await database.get('_schema')) as TinaCloudSchemaBase
  const tinaSchema = await createSchema({ schema: config })
  const resolver = await createResolver({ database, tinaSchema })

  return graphql({
    schema: graphQLSchema,
    source: query,
    variableValues: variables,
    contextValue: {
      database,
    },
    typeResolver: async (source, _args, info) => {
      if (source.__typename) return source.__typename

      const namedType = getNamedType(info.returnType).toString()
      const lookup = await database.getLookup(namedType)
      if (lookup.resolveType === 'unionData') {
        return lookup.typeMap[source._template]
      } else {
        throw new Error(`Unable to find lookup key for ${namedType}`)
      }
    },
    fieldResolver: async (
      source: { [key: string]: undefined | Record<string, unknown> } = {},
      _args: object = {},
      _context: object,
      info: GraphQLResolveInfo
    ) => {
      const args = JSON.parse(JSON.stringify(_args))
      const returnType = getNamedType(info.returnType).toString()
      const lookup = await database.getLookup(returnType)
      const isMutation = info.parentType.toString() === 'Mutation'
      const value = source[info.fieldName]
      /**
       * `getCollection`
       */
      if (returnType === 'Collection') {
        if (value) {
          return value
        }
        if (info.fieldName === 'getCollections') {
          return tinaSchema.getCollections().map((collection) => {
            return resolver.resolveCollection(collection.name)
          })
        }
        return resolver.resolveCollection(args.collection)
      }
      // We assume the value is already fully resolved
      if (!lookup) {
        return value
      }
      /**
       * From here, we need more information on how to resolve this, aided
       * by the lookup value for the given return type, we can enrich the request
       * with more contextual information that we gathered at build-time.
       */
      switch (lookup.resolveType) {
        /**
         * `node(id: $id)`
         */
        case 'nodeDocument':
          assertShape<{ id: string }>(args, (yup) =>
            yup.object({ id: yup.string().required() })
          )
          return resolver.getDocument(args.id)
        case 'multiCollectionDocument':
          if (typeof value === 'string') {
            /**
             * This is a reference value (`director: /path/to/george.md`)
             */
            return resolver.getDocument(value)
          }
          if (
            args &&
            args.collection &&
            info.fieldName === 'addPendingDocument'
          ) {
            /**
             * `addPendingDocument`
             * FIXME: this should probably be it's own lookup
             */
            return resolver.resolveDocument({
              value,
              args: { ...args, params: {} },
              collection: args.collection,
              isMutation,
            })
          }
          if (args && args.collection) {
            /**
             * `getDocument`/`updateDocument`
             */
            return resolver.resolveDocument({
              value,
              args,
              collection: args.collection,
              isMutation,
            })
          }
          return value
        /**
         * eg `getMovieDocument.data.actors`
         */
        case 'multiCollectionDocumentList':
          assertShape<string[]>(value, (yup) => yup.array().of(yup.string()))
          return resolver.resolveCollectionConnections({
            ids: value,
          })
        /**
         * Collections-specific getter
         * eg. `getPageDocument`/`updatePageDocument`
         *
         * if coming from a query result
         * the field will be `node`
         */
        case 'collectionDocument':
          if (value) {
            return value
          }
          return resolver.resolveDocument({
            value,
            args,
            collection: lookup.collection,
            isMutation,
          })

        /**
         * Collections-specific list getter
         * eg. `getPageList`
         */
        case 'collectionDocumentList':
          return resolver.resolveCollectionConnection({ args, lookup })
        /**
         * A polymorphic data set, it can be from a document's data
         * of any nested object which can be one of many shapes
         *
         * ```graphql
         * getPostDocument(relativePath: $relativePath) {
         *   data {...} <- this part
         * }
         * ```
         * ```graphql
         * getBlockDocument(relativePath: $relativePath) {
         *   data {
         *     blocks {...} <- or this part
         *   }
         * }
         * ```
         */
        case 'unionData':
          // `unionData` is used by the typeResolver, need to keep this check in-place
          // This is an array in many cases so it's easier to just pass it through
          // to be handled by the `typeResolver`
          return value
        default:
          console.error(lookup)
          throw new Error(`Unexpected resolve type`)
      }
    },
  })
}
