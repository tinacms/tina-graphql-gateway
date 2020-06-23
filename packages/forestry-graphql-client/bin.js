// server.js
const { createServer } = require("http");
const { parse } = require("url");
const path = require("path");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const dir = path.resolve(__dirname);
const app = next({ dir, dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);

    const configPath = path.resolve(process.cwd() + "/.forestry/config.js");
    const userConfig = require(configPath);

    const config = {
      rootPath: process.cwd(),
      ...userConfig,
    };

    req.headers = {
      ...req.headers,
      "Forestry-Config": JSON.stringify(config),
    };

    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:3000");
  });
});
