import { setupTests } from "../setupTests";

setupTests({
  "an invalid default date": {
    initial: {
      name: "expirydate",
      label: "Expirydate",
      type: "datetime",
      default: "20-07-13T19:00:00-03:00",
    },
    errors: [
      {
        dataPath: ".default",
        keyword: "anyOf",
      },
    ],
  },
});
