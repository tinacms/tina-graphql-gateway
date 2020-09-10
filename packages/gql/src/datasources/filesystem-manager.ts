import type { DataSource } from "./datasource";

export const FilesystemDataSource = (): DataSource => {
  return {
    getData: (args) => {
      return {
        _template: "some-real-data",
        _fields: {},
        data: { some: "" },
        content: "",
      };
    },
  };
};
