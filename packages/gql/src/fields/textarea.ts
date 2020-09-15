import { GraphQLString } from "graphql";

export type TextareaField = {
  label: string;
  name: string;
  type: "textarea";
  default: string;
  config?: {
    required?: boolean;
  };
};

const getter = ({ value, field }: { value: string; field: TextareaField }) => {
  return value;
};
const builder = ({ field }: { field: TextareaField }) => {
  return { type: GraphQLString };
};

export const textarea = {
  getter,
  builder,
};
