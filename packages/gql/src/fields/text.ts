import { GraphQLString } from "graphql";

export type TextField = {
  label: string;
  name: string;
  type: "text";
  default: string;
  config?: {
    required?: boolean;
  };
};

const getter = ({ value, field }: { value: string; field: TextField }) => {
  return value;
};
const builder = ({ field }: { field: TextField }) => {
  return { type: GraphQLString };
};

export const text = {
  getter,
  builder,
};
