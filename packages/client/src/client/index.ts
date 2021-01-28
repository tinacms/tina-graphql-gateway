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
  formBuilder,
  mutationGenerator,
  queryGenerator,
} from "@forestryio/graphql-helpers";
import gql from "graphql-tag";
import {
  getIntrospectionQuery,
  buildClientSchema,
  print,
  DocumentNode,
  GraphQLSchema,
} from "graphql";
import {
  authenticate,
  TokenObject,
  AUTH_TOKEN_KEY,
} from "../auth/authenticate";
import { transformPayload } from "./transform-payload";

interface AddVariables {
  path: string;
  template: string;
  params?: any;
}

const REACT_APP_USER_POOL_DASHBOARD_DOMAIN_SUFFIX =
  "auth.ca-central-1.amazoncognito.com";

interface ServerOptions {
  realm: string;
  clientId: string;
  branch: string;
  redirectURI: string;
  customAPI?: string;
  identityProxy?: string;
  getTokenFn?: () => TokenObject;
  tokenStorage?: "MEMORY" | "LOCAL_STORAGE" | "CUSTOM";
}

export class Client {
  serverURL: string;
  oauthHost: string;
  identityHost: string;
  schema: GraphQLSchema;
  clientId: string;
  query: string;
  redirectURI: string;
  setToken: (_token: TokenObject) => void;
  private getToken: () => TokenObject;
  private token: string; // used with memory storage

  constructor({ tokenStorage = "MEMORY", ...options }: ServerOptions) {
    const _this = this;
    (this.serverURL =
      options.customAPI ||
      `https://content.tinajs.dev/github/${options.realm}/${options.clientId}/${options.branch}`),
      (this.oauthHost =
        options.identityProxy ||
        `https://tina-auth-${options.realm}.${REACT_APP_USER_POOL_DASHBOARD_DOMAIN_SUFFIX}`);
    this.redirectURI = options.redirectURI;
    this.clientId = options.clientId;

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
    const res = await fetch(this.serverURL, {
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

    return res.json();
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
    const token = await authenticate(
      this.clientId,
      this.oauthHost,
      this.redirectURI
    );
    this.setToken(token);
    return token;
  }

  async getUser() {
    const url = `${this.oauthHost}/oauth2/userInfo`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: new Headers({
          Authorization: "Bearer " + this.getToken().access_token,
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
