import { setupTests } from "../setupTests";

setupTests({
  "with a missing label": {
    initial: {
      name: "boolean",
      type: "boolean",
    },
    errors: [
      {
        dataPath: "",
        keyword: "required",
      },
    ],
  },
});
