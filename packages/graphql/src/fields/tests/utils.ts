import { GraphQLObjectType, GraphQLSchema, graphql } from "graphql";

// returns true if you can run the passed query
export const queryMatchesType = async (
  gqlType: GraphQLObjectType,
  query: string
) => {
  const schema = new GraphQLSchema({ query: gqlType });
  const queryResult = await graphql(schema, query)
    .then((result: any) => {
      if (!result.errors) return true;
      return false;
    })
    .catch(() => false);

  return queryResult;
};
