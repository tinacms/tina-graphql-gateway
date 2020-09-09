import {
  graphql,
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLFieldResolver,
  GraphQLUnionType,
  GraphQLTypeResolver,
} from "graphql";

describe("Settings Resolver", () => {
  describe("with Sample1 settings", () => {
    test("Outputs the expected result", async () => {
      const schema = new GraphQLSchema({
        query: new GraphQLObjectType({
          name: "Query",
          fields: {
            greeting: { type: GraphQLString },
            uni: {
              type: new GraphQLUnionType({
                name: "SomeUnion",
                types: [
                  new GraphQLObjectType({
                    name: "person",
                    fields: { name: { type: GraphQLString } },
                  }),
                ],
              }),
            },
            salutations: {
              type: new GraphQLObjectType({
                name: "salutations",
                fields: {
                  okkk: { type: GraphQLString },
                },
              }),
            },
          },
        }),
      });

      const query = `{ greeting, salutations { okkk }, uni { ...on person { name }} }`;

      // const res = await graphql(schema, query);
      const meh: GraphQLFieldResolver<any, any> = (
        source,
        args,
        context,
        info
      ) => {
        console.log({ type: "field", source, args, info: info.fieldName });
        return "Hi There";
      };

      const meh2: GraphQLTypeResolver<any, any> = (
        value,
        context,
        info,
        abstractType
      ) => {
        console.log(
          JSON.stringify(
            { type: "type", value, context, info, abstractType },
            null,
            2
          )
        );
        return "person";
      };

      const res = await graphql({
        schema,
        source: query,
        fieldResolver: meh,
        typeResolver: meh2,
      });

      expect(res).toEqual({
        data: {
          greeting: "Hi There",
          salutations: { okkk: "Hi There" },
          uni: {
            name: "Hi There",
          },
        },
      });
    });
  });
});
