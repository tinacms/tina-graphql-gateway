## Lifecycle

For a given schema to go from the `.tina/schema.ts` file to a fully functional GraphQL server, there are several steps:

1. Transpile and validate the schema.ts, commit that into a `__generated__` folder which is checked into source control.
2. Enrich the schema with metadata which we'll use during the GraphQL schema build.
3. Process the schema, producing a GraphQL schema as the output. As a side-effect, populate the **lookup map**.
4. Process a GraphQL request, pulling the GraphQL schema you generated as well as the lookup map to aid in resolving the data
5. Call the appropriate resolver function depending on the **lookup map** as determined by the return type specified in the query

## Naming

Since GraphQL types are global, field names must be namespaced:

```ts
const tinaSchema: TinaCloudSchema<string, string, false> = {
  collections: [
    {
      label: 'Movie',
      name: 'movie',
      path: 'content/movies',
      fields: [
        {
          type: 'object',
          label: 'Metadata'
          name: 'metadata'
          fields: [
            ...
          ]
        }
      ]
    }
  ]
}
```
The generated type for `seo->title` needs to be `MovieSeoMetadata`, since there could be another field called `metadata` elsewhere. Because of this, the defined schema is populated with a `namespace` property during the schema building process. It's the `namespace` property that is used to determine GraphQL names throughout the schema, you'll find the full list of generated names in the `NAMER` utility

## Lookup Map

The `LookupMap` is responsible for storing information about _how_ to resolve documents as data and arguments pass through the global `fieldResolver` function. Since we're resolving data as a graph, we're often resolving a document based on contextual information. This information is stored in a map during build time, so it sits alongside your GraphQL schema as an aide to make sense of the types we're returning.

As an example, when you query `getPostDocument(relativePath: "my-path.md")`, you're only providing part of the information that we need in order to figure out where the document lives. `relativePath` is relative the `collection` we're asking for, but we can't know the full path based on this information alone. So when we see a request come in that expects a _returnType_ of something we need to _look up_, we can gather more information from the lookup map. In this example, we'd see that we're expecting a return type of `PostDocument`. The trick here is that we've stored all the contextual information about this `type` in the lookup map when we built the schema:

```json
{
  "PostDocument": {
    "type": "PostDocument",
    "resolveType": "collectionDocument",
    "collection": "post"
  }
}
```

We can see that this document comes from the `post` collection. And can then go and find the `collection.path` to complete the picture: `collection.path + args.relativePath` will get us the full path (which acts as a global ID of sorts).

In some cases, we need to return a `__typename` property to disambiguate types in a union. This often comes up when working with a _polymorphic_ type like a page builder content model. So when we resolve the data we need to store some information that _maps_ our logic (which isn't global) to GraphQL's type system (which is global). As an example, for a collection which has multiple templates we'd store something like this in the lookup map:

```json
{
  "Post": {
    "type": "Post",
    "resolveType": "unionData",
    "typeMap": {
      "post": "PostPost",
      "article": "PostArticle"
    }
  },
}
```

And as data passes through it:

```json
{
  "title": "Hello, World",
  "_template": "article"
}
```

We need to indicate to GraphQL that this `__typename` is `PostArticle`, and we use the information in the lookup map to say that we should look at the `_template` property of our data to find the value `article`, and that is mapped to the GraphQL type of `PostArticle`.
