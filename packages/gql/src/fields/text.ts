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

export const text = {
  getter,
};
