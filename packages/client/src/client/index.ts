import { friendlyFMTName, queryBuilder } from "@forestryio/graphql-helpers";
import { getIntrospectionQuery, buildClientSchema, print } from "graphql";
import { authenticate, AUTH_COOKIE_NAME } from "../auth/authenticate";
import Cookies from "js-cookie";

const transform = (obj: any) => {
  if (typeof obj === "boolean") {
    return obj;
  }
  if (!obj) {
    return "";
  }
  if (typeof obj == "string" || typeof obj === "number") {
    return obj;
  }

  // FIXME unreliable
  if (obj.hasOwnProperty("path")) {
    return obj.path;
  }
  const { _template, __typename, ...rest } = obj;
  if (_template) {
    return { [_template.replace("FieldConfig", "Input")]: transform(rest) };
  }

  const accumulator = {};
  Object.keys(rest)
    .filter((key) => rest[key]) // remove items with null values
    .forEach((key) => {
      if (Array.isArray(rest[key])) {
        accumulator[key] = rest[key].map((item) => {
          return transform(item);
        });
      } else {
        accumulator[key] = transform(rest[key]);
      }
    });

  return accumulator;
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
const DEFAULT_IDENTITY_HOST = "http://localhost:3000";

interface ServerOptions {
  gqlServer?: string;
  oauthHost?: string;
  identityHost?: string;
}

export class ForestryClient {
  serverURL: string;
  oauthHost: string;
  identityHost: string;
  clientId: string;
  query: string;
  constructor(clientId: string, options?: ServerOptions) {
    this.serverURL = options?.gqlServer || DEFAULT_TINA_GQL_SERVER;
    this.oauthHost = options?.oauthHost || DEFAULT_TINA_OAUTH_HOST;
    this.identityHost = options?.identityHost || DEFAULT_IDENTITY_HOST;

    this.clientId = clientId;
  }

  addContent = async ({ path, template, payload }: AddProps) => {
    const mutation = `mutation addDocumentMutation($path: String!, $template: String!, $params: DocumentInput) {
      addDocument(path: $path, template: $template, params: $params) {
        __typename
      }
    }`;

    const transformedPayload = transform({
      _template: friendlyFMTName(template, { suffix: "field_config" }),
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

    const transformedPayload = transform({
      _template,
      __typename,
      data: rest,
    });
    // console.log(JSON.stringify(payload, null, 2));
    // console.log(JSON.stringify(transformedPayload, null, 2));

    await this.request<UpdateVariables>(mutation, {
      variables: { path: path, params: transformedPayload },
    });
  };

  async isAuthorized(): Promise<boolean> {
    return this.isAuthenticated(); // TODO - check access
  }

  async isAuthenticated(): Promise<boolean> {
    return !!(await this.getUser());
  }

  async authenticate() {
    return authenticate(this.clientId, this.oauthHost);
  }

  async getUser() {
    const url = `${this.identityHost}/me`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: new Headers({
          Authorization: "Bearer " + this.getCookie(AUTH_COOKIE_NAME),
          "Content-Type": "application/json",
        }),
      });
      const val = await res.json();
      if (!res.status.toString().startsWith("2")) {
        console.error(val.error);
        return null;
      }
      return val;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  private getCookie(cookieName: string): string | undefined {
    return Cookies.get(cookieName);
  }

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

export { useForestryForm } from "./useForestryForm";
