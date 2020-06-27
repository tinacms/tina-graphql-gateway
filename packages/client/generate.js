const fetch = require("node-fetch");
const generator = require("./dist/src/codegen/index.js");

const run = async () => {
  const res = await fetch("http://localhost:4001/api/schema", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = await res.json();
  if (json.errors) {
    console.error(json.errors);
    throw new Error("Failed to fetch API");
  }
  generator.generateTypes({ schema: res.json });
};

run();
