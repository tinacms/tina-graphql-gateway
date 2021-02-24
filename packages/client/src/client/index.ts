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
import { formify } from "@forestryio/graphql-helpers";

import gql from "graphql-tag";
import { transformPayload } from "./transform-payload";

interface ServerOptions {
  realm: string;
  clientId: string;
  branch: string;
  customContentApiUrl?: string;
  getTokenFn?: () => TokenObject;
  tokenStorage?: "MEMORY" | "LOCAL_STORAGE" | "CUSTOM";
}

const TINA_CLOUD_API_URL =
  "https://82ptjhdl6d.execute-api.ca-central-1.amazonaws.com/dev";

export class Client {
  contentApiUrl: string;
  realm: string;
  schema: GraphQLSchema;
  clientId: string;
  query: string;
  setToken: (_token: TokenObject) => void;
  private getToken: () => TokenObject;
  private token: string; // used with memory storage

  constructor({ tokenStorage = "MEMORY", ...options }: ServerOptions) {
    const _this = this;
    (this.contentApiUrl =
      options.customContentApiUrl ||
      `https://content.tinajs.dev/github/${options.realm}/${options.clientId}/${options.branch}`),
      (this.clientId = options.clientId);
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

    const result = await this.request(mutation, {
      variables: props,
    });

    return result;
  };

  getSchema = async () => {
    if (!this.schema) {
      const data = await this.request<any>(getIntrospectionQuery(), {
        variables: {},
      });

      this.schema = buildClientSchema(data);
    }

    return this.schema;
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

  async requestWithForm<ReturnType>(
    query: (gqlTag: typeof gql) => DocumentNode,
    { variables }: { variables }
  ) {
    const schema = await this.getSchema();
    const formifiedQuery = formify(query(gql), schema);

    return this.request<ReturnType>(print(formifiedQuery), { variables });
  }

  async request<ReturnType>(
    query: ((gqlTag: typeof gql) => DocumentNode) | string,
    { variables }: { variables: object }
  ): Promise<ReturnType> {
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
    return json.data as ReturnType;
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
    const url = `${TINA_CLOUD_API_URL}/currentUser`;

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

export class LocalClient extends Client {
  constructor(props?: { customContentApiUrl?: string }) {
    const clientProps = {
      realm: "",
      clientId: "",
      branch: "",
      customContentApiUrl:
        props && props.customContentApiUrl
          ? props.customContentApiUrl
          : DEFAULT_LOCAL_TINA_GQL_SERVER_URL,
    };
    super(clientProps);
  }
}
