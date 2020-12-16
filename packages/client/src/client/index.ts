import {
  formBuilder,
  mutationGenerator,
  queryGenerator,
} from "@forestryio/graphql-helpers";
import {
  getIntrospectionQuery,
  buildClientSchema,
  print,
  DocumentNode,
  GraphQLSchema,
} from "graphql";
import { authenticate, AUTH_TOKEN_KEY } from "../auth/authenticate";
import { transformPayload } from "./transform-payload";

interface UpdateVariables {
  relativePath: string;
  params: unknown;
}

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
  redirectURI: string;
  customAPI?: string;
  identityProxy?: string;
  getTokenFn?: () => string;
  tokenStorage?: "MEMORY" | "LOCAL_STORAGE" | "CUSTOM";
}

export class ForestryClient {
  serverURL: string;
  oauthHost: string;
  identityHost: string;
  schema: GraphQLSchema;
  clientId: string;
  query: string;
  redirectURI: string;
  setToken: (_token: string) => void;
  private getToken: () => string;
  private token: string; // used with memory storage

  constructor({ tokenStorage = "MEMORY", ...options }: ServerOptions) {
    const _this = this;
    (this.serverURL =
      options.customAPI ||
      `https://content.tinajs.dev/github/${options.realm}/${options.clientId}`),
      (this.oauthHost =
        options.identityProxy ||
        `https://tina-auth-${options.realm}.${REACT_APP_USER_POOL_DASHBOARD_DOMAIN_SUFFIX}`);
    this.redirectURI = options.redirectURI;
    this.clientId = options.clientId;

    switch (tokenStorage) {
      case "LOCAL_STORAGE":
        this.getToken = function () {
          return localStorage.getItem(AUTH_TOKEN_KEY) || null;
        };
        this.setToken = function (token: string) {
          localStorage.setItem(AUTH_TOKEN_KEY, token);
        };
        break;
      case "MEMORY":
        this.getToken = function () {
          return _this.token;
        };
        this.setToken = function (token: string) {
          _this.token = token;
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
        path
        relativePath
        breadcrumbs(excludeExtension: true)
        filename
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

  updateContent = async ({
    mutationString,
    relativePath,
    values,
  }: {
    mutationString: string;
    relativePath: string;
    values: object;
  }) => {
    const schema = await this.getSchema();
    const params = transformPayload({
      mutation: mutationString,
      values: values,
      schema,
    });

    await this.request<UpdateVariables>(mutationString, {
      variables: {
        relativePath,
        params,
      },
    });
  };

  async requestWithForm<VariableType>({
    query,
    variables,
  }: {
    query: DocumentNode;
    variables: VariableType;
  }) {
    const schema = await this.getSchema();
    const formifiedQuery = formBuilder(query, schema);

    return this.request(print(formifiedQuery), { variables });
  }

  async request<VariableType>(
    query: string,
    { variables }: { variables: VariableType }
  ) {
    const res = await fetch(this.serverURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + this.getToken(),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const json = await res.json();
    if (json.errors) {
      console.error(json.errors);
      // throw new Error("Failed to fetch API");
    }
    return json.data;
  }

  async isAuthorized(): Promise<boolean> {
    return this.isAuthenticated(); // TODO - check access
  }

  async isAuthenticated(): Promise<boolean> {
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
          Authorization: "Bearer " + this.getToken(),
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
}

export { ForestryMediaStore } from "./media-store";

export const DEFAULT_LOCAL_TINA_GQL_SERVER_URL =
  "http://localhost:4001/graphql";
