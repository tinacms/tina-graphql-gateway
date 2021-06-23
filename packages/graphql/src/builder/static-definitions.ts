import { astBuilder } from '../ast-builder'

/**
 * Definitions for static interfaces which are identical
 * for any schema, ex. Node
 */
const interfaceDefinitions = [
  astBuilder.InterfaceTypeDefinition({
    name: 'Node',
    fields: [
      astBuilder.FieldDefinition({
        name: 'id',
        type: astBuilder.TYPES.ID,
        required: true,
      }),
    ],
  }),
  astBuilder.InterfaceTypeDefinition({
    name: 'Document',
    fields: [
      // astBuilder.FieldDefinition({ name: "sys", type: astBuilder.TYPES.SystemInfo }),
      astBuilder.FieldDefinition({
        name: 'id',
        type: astBuilder.TYPES.ID,
        required: true,
      }),
    ],
  }),
  astBuilder.InterfaceTypeDefinition({
    name: 'Connection',
    description: 'A relay-compliant pagination connection',
    fields: [
      astBuilder.FieldDefinition({
        name: 'totalCount',
        required: true,
        type: astBuilder.TYPES.Number,
      }),
    ],
  }),
]

/**
 * Definitions for additional scalars, ex. JSON
 */
const scalarDefinitions = [
  astBuilder.ScalarTypeDefinition({
    name: 'Reference',
    description: 'References another document, used as a foreign key',
  }),
  astBuilder.ScalarTypeDefinition({ name: 'JSON' }),
  astBuilder.ObjectTypeDefinition({
    name: 'SystemInfo',
    fields: [
      astBuilder.FieldDefinition({
        name: 'filename',
        type: astBuilder.TYPES.String,
      }),
      astBuilder.FieldDefinition({
        name: 'basename',
        type: astBuilder.TYPES.String,
      }),
      astBuilder.FieldDefinition({
        name: 'breadcrumbs',
        type: astBuilder.TYPES.String,
        list: true,
        args: [
          astBuilder.InputValueDefinition({
            name: 'excludeExtension',
            type: astBuilder.TYPES.Boolean,
          }),
        ],
      }),
      astBuilder.FieldDefinition({
        name: 'path',
        type: astBuilder.TYPES.String,
      }),
      astBuilder.FieldDefinition({
        name: 'relativePath',
        type: astBuilder.TYPES.String,
      }),
      astBuilder.FieldDefinition({
        name: 'extension',
        type: astBuilder.TYPES.String,
      }),
      astBuilder.FieldDefinition({
        name: 'template',
        type: astBuilder.TYPES.String,
      }),
      astBuilder.FieldDefinition({
        name: 'collection',
        type: astBuilder.TYPES.Collection,
      }),
    ],
  }),
  astBuilder.ObjectTypeDefinition({
    name: 'PageInfo',
    fields: [
      astBuilder.FieldDefinition({
        name: 'hasPreviousPage',
        required: true,
        type: astBuilder.TYPES.Boolean,
      }),
      astBuilder.FieldDefinition({
        name: 'hasNextPage',
        required: true,
        type: astBuilder.TYPES.Boolean,
      }),
      astBuilder.FieldDefinition({
        name: 'startCursor',
        required: true,
        type: astBuilder.TYPES.String,
      }),
      astBuilder.FieldDefinition({
        name: 'endCursor',
        required: true,
        type: astBuilder.TYPES.String,
      }),
    ],
  }),
]

export const staticDefinitions = [...scalarDefinitions, interfaceDefinitions]
