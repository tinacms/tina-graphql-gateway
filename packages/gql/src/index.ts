import express from "express";
import { graphqlHTTP } from "express-graphql";
import { schemaBuilder } from "./schema-builder";
import { graphqlInit } from "./graphql";
import type { Field, TinaDocument } from "./datasources/datasource";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import WebSocket from "ws";
import fs from "fs";

const postTemplate = {
  label: "Post",
  hide_body: false,
  fields: [
    {
      type: "textarea" as const,
      label: "Title",
      name: "title",
    },
    {
      type: "select" as const,
      label: "Author",
      name: "author",
      config: {
        source: "documents" as const,
        section: "authors",
      },
    },
    {
      type: "blocks" as const,
      label: "Sections",
      name: "sections",
      template_types: ["section"],
    },
  ],
};
const authorTemplate = {
  label: "Author",
  hide_body: false,
  fields: [
    {
      type: "textarea" as const,
      label: "Name",
      name: "name",
    },
  ],
};
const sectionTemplate = {
  label: "Section",
  hide_body: false,
  fields: [
    {
      type: "textarea" as const,
      label: "Description",
      name: "description",
    },
  ],
};

const mockGetData = async ({ path }): Promise<TinaDocument> => {
  if (path === "some-path.md") {
    const fields: { [key: string]: Field } = {};
    postTemplate.fields.forEach((field) => (fields[field.name] = field));
    const data = JSON.parse(
      await fs
        .readFileSync(
          "/Users/jeffsee/code/graphql-demo/packages/gql/src/fixtures/project1/content/post1.json"
        )
        .toString()
    );
    return {
      _template: postTemplate.label,
      _fields: {
        data: fields,
        content: { type: "textarea", name: "content", label: "Content" },
      },
      ...data,
      // data: {
      //   title: "Some Title",
      //   author: "/path/to/author.md",
      //   sections: [
      //     {
      //       description: "Some textarea description",
      //     },
      //   ],
      // },
      // content: "Some Content",
    };
  }
  if (path === "/path/to/author.md") {
    const fields: { [key: string]: Field } = {};
    authorTemplate.fields.forEach((field) => (fields[field.name] = field));
    return {
      _template: authorTemplate.label,
      _fields: {
        data: fields,
        content: { type: "textarea", name: "content", label: "Content" },
      },
      data: {
        name: "Homer Simpson",
      },
      content: "Some Content",
    };
  }

  throw `No path mock for ${path}`;
};

const MockDataSource = () => {
  return { getData: mockGetData };
};

const mockGetTemplates = () => {
  return [postTemplate, authorTemplate, sectionTemplate];
};
const mockGetTemplate = (slug) => {
  if (slug === "Sections") {
    return sectionTemplate;
  } else {
    return authorTemplate;
  }
};

const MockSchemaSource = () => {
  return { getTemplates: mockGetTemplates, getTemplate: mockGetTemplate };
};

const app = express();
//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws: WebSocket) => {
  //connection is up, let's add a simple simple event
  ws.on("message", (message: string) => {
    //log the received message and send it back to the client
    console.log("received: %s", message);
    ws.send(`Hello, you sent -> ${message}`);
  });

  //send immediatly a feedback to the incoming connection
  ws.send("Hi there, I am a WebSocket server?");
});

app.use(cors());
app.use(bodyParser.json());

app.post("/:schema", async (req, res) => {
  const { query, variables } = req.body;

  const result = await graphqlInit({
    schema: schemaBuilder({ schemaSource: MockSchemaSource() }),
    source: query,
    contextValue: { datasource: MockDataSource() },
    variableValues: variables,
  });
  return res.json(result);
});

server.listen(4000, () => {
  console.info("Listening on http://localhost:4000");
});
