import { friendlyFMTName, queryBuilder } from "@forestryio/graphql-helpers";
import { getIntrospectionQuery, buildClientSchema, print } from "graphql";
// import type { Field } from "tinacms";

type BlockItem = {
  label: string;
  _template: string;
} & object;

type BlockField = {
  templates: BlockItem[];
};

const handleInner = (values, field: Field & { fields: Field[] }) => {
  const value = values[field.name];
  if (!value) {
    return;
  }

  switch (field.component) {
    case "text":
      return value;
    case "blocks":
      const blockField = field as BlockField;

      return value.map((v) => {
        const acc: { [key: string]: any } = {};
        const template = blockField.templates[v._template];
        if (!template) {
          throw new Error(`Unable to find template in field ${field.name}`);
        }
        acc[`${template.label}InputData`] = {
          template: v._template,
          ...handleData(v, template),
        };

        return acc;
      });
    // Return an array of one value, tagged union pattern

    case "group":
      // FIXME: this shouldn't be sent down for anything other than blocks
      const { _template, ...rest } = value;

      return rest;

    default:
      return value;
  }
};

export const handleData = (values, schema: { fields: Field[] }) => {
  const accum: { [key: string]: any } = {};
  schema.fields.forEach((field) => {
    accum[field.name] = handleInner(values, field);
  });

  return accum;
};

export const handle = (values, schema: { fields: Field[] }) => {
  const accum: { [key: string]: any } = {};
  schema.fields.forEach((field) => {
    accum[field.name] = handleInner(values, field);
  });

  return { [`${schema.label}Input`]: { data: accum } };
};

interface AddProps {
  url: string;
  path: string;
  template: string;
  payload: any;
}

interface UpdateVariables {
  path: string;
  params?: any;
}

interface AddVariables {
  path: string;
  template: string;
  params?: any;
}

const DEFAULT_TINA_GQL_SERVER = "http://localhost:4001/api/graphql";
const DEFAULT_TINA_OAUTH_HOST = "http://localhost:4444";

interface ServerOptions {
  gqlServer?: string;
  oauthHost?: string;
  identityHost?: string;
}

export class ForestryClient {
  serverURL: string;
  oauthHost: string;
  clientId: string;
  query: string;

  constructor(clientId: string, options?: ServerOptions) {
    this.serverURL = options?.gqlServer || DEFAULT_TINA_GQL_SERVER;
    this.oauthHost = options?.oauthHost || DEFAULT_TINA_OAUTH_HOST;

    this.clientId = clientId;
  }

  addContent = async ({ path, template, payload }: AddProps) => {
    const mutation = `mutation addDocumentMutation($path: String!, $template: String!, $params: DocumentInput) {
      addDocument(path: $path, template: $template, params: $params) {
        __typename
      }
    }`;

    const transformedPayload = transform({
      // _template: friendlyFMTName(template, { suffix: "field_config" }),
      data: payload,
    });

    await this.request<AddVariables>(mutation, {
      variables: {
        path: path,
        template: template + ".yml",
        params: transformedPayload,
      },
    });
  };

  getQuery = async () => {
    if (!this.query) {
      const data = await this.request(getIntrospectionQuery(), {
        variables: {},
      });

      this.query = print(queryBuilder(buildClientSchema(data)));
    }

    return this.query;
  };

  getContent = async <T>({
    path,
  }: {
    path: string;
  }): Promise<{
    data: T;
    formConfig: any;
  }> => {
    const query = await this.getQuery();
    const data = await this.request(query, {
      variables: { path },
    });

    return data;
  };

  updateContent = async ({ path, payload }: { path: string; payload: any }) => {
    const mutation = `mutation updateDocumentMutation($path: String!, $params: DocumentInput) {
      updateDocument(path: $path, params: $params) {
        __typename
      }
    }`;
    const { _template, __typename, ...rest } = payload;

    const transformedPayload = payload;
    // console.log(JSON.stringify(payload, null, 2));
    // console.log(JSON.stringify(transformedPayload, null, 2));

    await this.request<UpdateVariables>(mutation, {
      variables: { path: path, params: transformedPayload },
    });
  };

  private async request<VariableType>(
    query: string,
    { variables }: { variables: VariableType }
  ) {
    const res = await fetch(this.serverURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const json = await res.json();
    if (json.errors) {
      console.error(json.errors);
      throw new Error("Failed to fetch API");
    }
    return json.data;
  }
}
