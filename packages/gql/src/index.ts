import express from "express";
import { graphqlHTTP } from "express-graphql";
import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  print,
  parse,
} from "graphql";
import { makeExecutableSchema } from "graphql-tools";

const schema = makeExecutableSchema({
  typeDefs: `
    type Query {
      greeting: String
    }
  `,
  resolvers: {
    Query: {
      greeting: () => "Hello World",
    },
  },
});

export const buildSchema = () => {
  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      fields: {
        greeting: { type: GraphQLString },
      },
    }),
  });

  return print(parse(schema));
};

const schema2 = makeExecutableSchema({
  typeDefs: `
    type Query {
      greeting: String
    }
  `,
  resolvers: {
    Query: {
      greeting: () => "Hi World",
    },
  },
});

const app = express();
// app.use(
//   graphqlHTTP({
//     schema,
//     graphiql: {
//       defaultQuery: `
//         {
//           greeting
//         }
//       `,
//     },
//   })
// );

const schemas: { [key: string]: GraphQLSchema } = {
  one: schema,
  two: schema2,
};

app.get("/:schema", (req, res) => {
  let query = `{ greeting }`;
  const schema = schemas[req.params.schema];
  graphql(schema, query).then((result) => {
    res.json(result);
  });
});

app.listen(4000, () => {
  console.info("Listening on http://localhost:4000");
});
