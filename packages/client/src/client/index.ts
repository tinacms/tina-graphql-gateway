/**
Copyright 2021 Forestry.io Inc
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
  AUTH_TOKEN_KEY,
  TokenObject,
  authenticate,
} from "../auth/authenticate";
import {
  DocumentNode,
  GraphQLSchema,
  buildClientSchema,
  getIntrospectionQuery,
  print,
} from "graphql";
import {
  formBuilder,
  mutationGenerator,
  queryGenerator,
} from "@forestryio/graphql-helpers";

import gql from "graphql-tag";
import { transformPayload } from "./transform-payload";

interface AddVariables {
  path: string;
  template: string;
  params?: any;
}

interface ServerOptions {
  realm: string;
  clientId: string;
  branch: string;
  redirectURI: string;
  customContentApiUrl?: string;
  customTinaCloudApiUrl?: string;
  getTokenFn?: () => TokenObject;
  tokenStorage?: "MEMORY" | "LOCAL_STORAGE" | "CUSTOM";
}

export class Client {
  contentApiUrl: string;
  realm: string;
  tinaCloudApiUrl: string;
  schema: GraphQLSchema;
  clientId: string;
  query: string;
  redirectURI: string;
  setToken: (_token: TokenObject) => void;
  private getToken: () => TokenObject;
  private token: string; // used with memory storage

  constructor({ tokenStorage = "MEMORY", ...options }: ServerOptions) {
    const _this = this;
    (this.contentApiUrl =
      options.customContentApiUrl ||
      `https://content.tinajs.dev/github/${options.realm}/${options.clientId}/${options.branch}`),
    this.tinaCloudApiUrl = options.customTinaCloudApiUrl || "auth.ca-central-1.amazoncognito.com";
    this.redirectURI = options.redirectURI;
    this.clientId = options.clientId;
    this.realm = options.realm;

    switch (tokenStorage) {
      case "LOCAL_STORAGE":
        this.getToken = function () {
          const tokens = localStorage.getItem(AUTH_TOKEN_KEY) || null;
          if (tokens) {
            return JSON.parse(tokens);
          } else {
            return {
              access_token: null,
              id_token: null,
              refresh_token: null,
            };
          }
        };
        this.setToken = function (token) {
          localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(token, null, 2));
        };
        break;
      case "MEMORY":
        this.getToken = function () {
          if (_this.token) {
            return JSON.parse(_this.token);
          } else {
            return {
              access_token: null,
              id_token: null,
              refresh_token: null,
            };
          }
        };
        this.setToken = function (token) {
          _this.token = JSON.stringify(token, null, 2);
        };
        break;
      case "CUSTOM":
        if (!options.getTokenFn) {
          throw new Error(
            "When CUSTOM token storage is selected, a getTokenFn must be provided"
          );
        }
        this.getToken = options.getTokenFn;
        break;
    }
  }

  addPendingContent = async (props) => {
    const mutation = `mutation addPendingDocumentMutation($relativePath: String!, $template: String!, $section: String!) {
      addPendingDocument(relativePath: $relativePath, template: $template, section: $section) {
        sys {
          relativePath
          path
          breadcrumbs(excludeExtension: true)
          section {
            slug
          }
        }
      }
    }`;

    const result = await this.request<AddVariables>(mutation, {
      variables: props,
    });

    return result;
  };

  getSchema = async () => {
    if (!this.schema) {
      const data = await this.request(getIntrospectionQuery(), {
        variables: {},
      });

      this.schema = buildClientSchema(data);
    }

    return this.schema;
  };

  generateMutation = async (variables: {
    relativePath: string;
    section: string;
  }) => {
    const schema = await this.getSchema();
    const query = queryGenerator(variables, schema);
    const formifiedQuery = formBuilder(query, schema);
    const res = await this.request(print(formifiedQuery), { variables });
    const result = Object.values(res)[0];
    const mutation = mutationGenerator(variables, schema);

    const params = await transformPayload({
      mutation: print(mutation),
      // @ts-ignore FIXME: this needs an assertion
      values: result.values,
      schema,
      sys: res.sys,
    });

    return {
      queryString: print(mutation),
      variables: {
        relativePath: variables.relativePath,
        params,
      },
    };
  };

  generateQuery = async (variables: {
    relativePath: string;
    section: string;
  }) => {
    const schema = await this.getSchema();
    const query = queryGenerator(variables, schema);
    return {
      queryString: print(query),
      variables: { relativePath: variables.relativePath },
    };
  };

  prepareVariables = async ({
    mutationString,
    relativePath,
    values,
    sys,
  }: {
    mutationString: string;
    relativePath: string;
    values: object;
    sys: {
      template: string;
      section: {
        slug: string;
      };
    };
  }) => {
    const schema = await this.getSchema();
    const params = transformPayload({
      mutation: mutationString,
      values: values,
      sys,
      schema,
    });

    return {
      relativePath,
      params,
    };
  };

  async requestWithForm<VariableType>(
    query: (gqlTag: typeof gql) => DocumentNode,
    { variables }: { variables: VariableType }
  ) {
    const schema = await this.getSchema();
    const formifiedQuery = formBuilder(query(gql), schema);

    return this.request(print(formifiedQuery), { variables });
  }

  async request<VariableType>(
    query: ((gqlTag: typeof gql) => DocumentNode) | string,
    { variables }: { variables: VariableType }
  ) {
    const res = await fetch(this.contentApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + this.getToken().id_token,
      },
      body: JSON.stringify({
        query: typeof query === "function" ? print(query(gql)) : query,
        variables,
      }),
    });

    const json = await res.json();
    if (json.errors) {
      return json;
    }
    return json.data;
  }

  async isAuthorized(): Promise<boolean> {
    if (this.isLocalClient()) {
      return true;
    }

    return this.isAuthenticated(); // TODO - check access
  }

  isLocalClient(): boolean {
    return !this.clientId;
  }

  async isAuthenticated(): Promise<boolean> {
    if (this.isLocalClient()) {
      return true;
    }

    return !!(await this.getUser());
  }

  async authenticate() {
    const token = await authenticate(this.clientId, this.realm);
    this.setToken(token);
    return token;
  }

  async getUser() {
    const url = `${this.tinaCloudApiUrl}/currentUser`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: new Headers({
          Authorization: "Bearer " + this.getToken().id_token,
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
}

export { ForestryMediaStore } from "./media-store";

export const DEFAULT_LOCAL_TINA_GQL_SERVER_URL =
  "http://localhost:4001/graphql";
