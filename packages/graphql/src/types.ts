export interface TinaCloudSchema<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> {
  templates?: GlobalTemplate<
    GlobalTemplateName,
    CollectionName,
    WithNamespace
  >[]
  documents?: TinaCloudCollection<
    GlobalTemplateName,
    CollectionName,
    WithNamespace
  >[]
  collections: TinaCloudCollection<
    GlobalTemplateName,
    CollectionName,
    WithNamespace
  >[]
}
export type TinaCloudSchemaBase = TinaCloudSchema<string, string, false>
export type TinaCloudSchemaEnriched = TinaCloudSchema<string, string, true>

/**
 * As part of the build process, each node is given a `path: string[]` key
 * to help with namespacing type names, this is added as part of the
 * createTinaSchema step
 */
export interface TinaCloudSchemaWithNamespace<
  GlobalTemplateName extends string,
  CollectionName extends string
> {
  templates?: GlobalTemplate<GlobalTemplateName, CollectionName, true>[]
  documents?: TinaCloudCollection<GlobalTemplateName, CollectionName, true>[]
  collections: TinaCloudCollection<GlobalTemplateName, CollectionName, true>[]
  namespace: string[]
}

export type TinaCloudCollection<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> =
  | CollectionFields<GlobalTemplateName, CollectionName, WithNamespace>
  | CollectionTemplates<GlobalTemplateName, CollectionName, WithNamespace>

export type TinaCloudCollectionBase = TinaCloudCollection<string, string, false>
export type TinaCloudCollectionEnriched = TinaCloudCollection<
  string,
  string,
  true
>

type FormatType = 'json' | 'md' | 'markdown' | 'yml' | 'yaml'

interface BaseCollection<CollectionName extends string> {
  label: string
  name: string
  path: string
  format?: FormatType
  match?: string
}

type CollectionTemplates<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> = WithNamespace extends true
  ? CollectionTemplatesWithNamespace<
      GlobalTemplateName,
      CollectionName,
      WithNamespace
    >
  : CollectionTemplatesInner<GlobalTemplateName, CollectionName, WithNamespace>

interface CollectionTemplatesInner<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> extends BaseCollection<CollectionName> {
  templates: (
    | DontInfer<GlobalTemplateName>
    | Template<GlobalTemplateName, CollectionName, WithNamespace>
  )[]
  fields?: undefined
}
export interface CollectionTemplatesWithNamespace<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> extends BaseCollection<CollectionName> {
  templates: (
    | DontInfer<GlobalTemplateName>
    | Template<GlobalTemplateName, CollectionName, WithNamespace>
  )[]
  fields?: undefined
  references?: ReferenceType<CollectionName, WithNamespace>[]
  namespace: WithNamespace extends true ? string[] : undefined
}

type CollectionFields<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> = WithNamespace extends true
  ? CollectionFieldsWithNamespace<
      GlobalTemplateName,
      CollectionName,
      WithNamespace
    >
  : CollectionFieldsInner<GlobalTemplateName, CollectionName, WithNamespace>

export interface CollectionFieldsWithNamespace<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> extends BaseCollection<CollectionName> {
  fields:
    | DontInfer<GlobalTemplateName>
    | TinaFieldInner<
        DontInfer<GlobalTemplateName>,
        DontInfer<CollectionName>,
        WithNamespace
      >[]
  templates?: undefined
  references?: ReferenceType<CollectionName, WithNamespace>[]
  namespace: string[]
}

interface CollectionFieldsInner<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> extends BaseCollection<CollectionName> {
  fields:
    | DontInfer<GlobalTemplateName>
    | TinaFieldInner<
        DontInfer<GlobalTemplateName>,
        DontInfer<CollectionName>,
        false
      >[]
  templates?: undefined
}

export type TinaFieldInner<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> =
  | ScalarType<WithNamespace>
  | ObjectType<GlobalTemplateName, CollectionName, WithNamespace>
  | ReferenceType<CollectionName, WithNamespace>

export type TinaFieldBase = TinaFieldInner<string, string, false>
export type TinaFieldEnriched = TinaFieldInner<string, string, true>

interface TinaField {
  name: string
  label: string
  description?: string
  list?: boolean
}

type ScalarType<WithNamespace extends boolean> = WithNamespace extends true
  ? ScalarTypeWithNamespace<WithNamespace>
  : ScalarTypeInner
interface ScalarTypeInner extends TinaField {
  type: 'string' | 'text' | 'boolean' | 'number' | 'image' | 'datetime'
  isBody?: boolean
  options?: (
    | string
    | {
        label: string
        value: string
      }
  )[]
}
interface ScalarTypeWithNamespace<WithNamespace extends boolean>
  extends TinaField {
  type: 'string' | 'text' | 'boolean' | 'number' | 'image' | 'datetime'
  isBody?: boolean
  options?: (
    | string
    | {
        label: string
        value: string
      }
  )[]
  namespace: WithNamespace extends true ? string[] : undefined
}

export type ReferenceType<
  CollectionName extends string,
  WithNamespace extends boolean
> = WithNamespace extends true
  ? ReferenceTypeWithNamespace<CollectionName, WithNamespace>
  : ReferenceTypeInner<CollectionName>
export interface ReferenceTypeInner<CollectionName extends string>
  extends TinaField {
  type: 'reference'
  reverseLookup?: { label: string; name: string }
  collections: CollectionName[]
}
export interface ReferenceTypeWithNamespace<
  CollectionName extends string,
  WithNamespace extends boolean
> extends TinaField {
  type: 'reference'
  collections: CollectionName[]
  reverseLookup?: { label: string; name: string }
  namespace: WithNamespace extends true ? string[] : undefined
}

export type ObjectType<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> =
  | ObjectTemplates<GlobalTemplateName, CollectionName, WithNamespace>
  | ObjectFields<GlobalTemplateName, CollectionName, WithNamespace>

type ObjectTemplates<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> = WithNamespace extends true
  ? ObjectTemplatesWithNamespace<
      GlobalTemplateName,
      CollectionName,
      WithNamespace
    >
  : ObjectTemplatesInner<GlobalTemplateName, CollectionName, WithNamespace>

interface ObjectTemplatesInner<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> extends TinaField {
  type: 'object'
  /**
   * templates can either be an array of Tina templates or a reference to
   * global template definition.
   *
   * You should use `templates` when your object can be any one of multiple shapes (polymorphic)
   *
   * You can only provide one of `fields` or `template`, but not both
   */
  templates: (
    | DontInfer<GlobalTemplateName>
    | Template<GlobalTemplateName, CollectionName, WithNamespace>
  )[]
  fields?: undefined
}

interface ObjectTemplatesWithNamespace<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> extends TinaField {
  type: 'object'
  /**
   * templates can either be an array of Tina templates or a reference to
   * global template definition.
   *
   * You should use `templates` when your object can be any one of multiple shapes (polymorphic)
   *
   * You can only provide one of `fields` or `template`, but not both
   */
  templates: (
    | DontInfer<GlobalTemplateName>
    | Template<GlobalTemplateName, CollectionName, WithNamespace>
  )[]
  fields?: undefined
  namespace: WithNamespace extends true ? string[] : undefined
}

type ObjectFields<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> = WithNamespace extends true
  ? InnerObjectFieldsWithNamespace<
      GlobalTemplateName,
      CollectionName,
      WithNamespace
    >
  : InnerObjectFields<GlobalTemplateName, CollectionName, WithNamespace>

interface InnerObjectFields<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> extends TinaField {
  type: 'object'
  /**
   * fields can either be an array of Tina fields, or a reference to the fields
   * of a global template definition.
   *
   * You can only provide one of `fields` or `templates`, but not both.
   */
  fields:
    | GlobalTemplateName
    | TinaFieldInner<
        DontInfer<GlobalTemplateName>,
        DontInfer<CollectionName>,
        WithNamespace
      >[]
  templates?: undefined
}

interface InnerObjectFieldsWithNamespace<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> extends TinaField {
  type: 'object'
  /**
   * fields can either be an array of Tina fields, or a reference to the fields
   * of a global template definition.
   *
   * You can only provide one of `fields` or `templates`, but not both.
   */
  fields:
    | GlobalTemplateName
    | TinaFieldInner<
        DontInfer<GlobalTemplateName>,
        DontInfer<CollectionName>,
        WithNamespace
      >[]
  templates?: undefined
  namespace: WithNamespace extends true ? string[] : undefined
}

/**
 * Global Templates are defined once, and can be used anywhere by referencing the 'name' of the template
 *
 * TODO: ensure we don't permit infite loop with self-references
 */
export type GlobalTemplate<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> = WithNamespace extends true
  ? {
      label: string
      name: GlobalTemplateName
      fields: TinaFieldInner<
        DontInfer<GlobalTemplateName>,
        DontInfer<CollectionName>,
        WithNamespace
      >[]
      namespace: WithNamespace extends true ? string[] : undefined
    }
  : {
      label: string
      name: GlobalTemplateName
      fields: TinaFieldInner<
        DontInfer<GlobalTemplateName>,
        DontInfer<CollectionName>,
        WithNamespace
      >[]
    }

export type TinaCloudTemplateBase = GlobalTemplate<string, string, false>
export type TinaCloudTemplateEnriched = GlobalTemplate<string, string, true>
/**
 * Templates allow you to define an object as polymorphic
 */
type Template<
  GlobalTemplateName extends string,
  CollectionName extends string,
  WithNamespace extends boolean
> = WithNamespace extends true
  ? {
      label: string
      name: string
      fields: TinaFieldInner<
        DontInfer<GlobalTemplateName>,
        DontInfer<CollectionName>,
        WithNamespace
      >[]
      namespace: WithNamespace extends true ? string[] : undefined
    }
  : {
      label: string
      name: string
      fields: TinaFieldInner<
        DontInfer<GlobalTemplateName>,
        DontInfer<CollectionName>,
        WithNamespace
      >[]
    }

type DontInfer<T> = T extends infer U ? U : never

type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : any

// Builder types
export type CollectionTemplateableUnion = {
  namespace: string[]
  type: 'union'
  templates: Templateable[]
}
export type CollectionTemplateableObject = {
  namespace: string[]
  type: 'object'
  template: Templateable
}
export type CollectionTemplateable =
  | CollectionTemplateableUnion
  | CollectionTemplateableObject

export type Collectable = {
  namespace: string[]
  templates?: (string | Templateable)[]
  fields?: string | TinaFieldEnriched[]
  references?: ReferenceType<string, true>[]
}

export type Templateable = {
  namespace: string[]
  fields: TinaFieldEnriched[]
}
