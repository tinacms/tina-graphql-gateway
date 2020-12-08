import {
  formBuilder,
  mutationGenerator,
  queryGenerator,
  queryBuilder,
} from "@forestryio/graphql-helpers";
import {
  getIntrospectionQuery,
  buildClientSchema,
  print,
  DocumentNode,
} from "graphql";
import { authenticate, AUTH_TOKEN_KEY } from "../auth/authenticate";
import { transformPayload } from "./handle";
import type { Field } from "tinacms";

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

  addContent = async ({ path, template, payload }: AddProps) => {
    const mutation = `mutation addDocumentMutation($path: String!, $template: String!, $params: DocumentInput) {
      addDocument(path: $path, template: $template, params: $params) {
        __typename
      }
    }`;

    // @ts-ignore
    const values = this.transformPayload(payload, form);

    await this.request<AddVariables>(mutation, {
      variables: {
        path: path,
        template: template + ".yml",
        params: values,
      },
    });
  };

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

  getQuery = async () => {
    if (!this.query) {
      const data = await this.request(getIntrospectionQuery(), {
        variables: {},
      });

      this.query = print(queryBuilder(buildClientSchema(data)));
    }

    return this.query;
  };
  getSectionQuery = async () => {
    if (!this.query) {
      const data = await this.request(getIntrospectionQuery(), {
        variables: {},
      });

      this.query = print(queryBuilder(buildClientSchema(data)));
    }

    return this.query;
  };

  generateMutation = async (variables: {
    relativePath: string;
    section: string;
  }) => {
    const data = await this.request(getIntrospectionQuery(), {
      variables: {},
    });
    const query = queryGenerator(variables, buildClientSchema(data));
    const formifiedQuery = formBuilder(query, buildClientSchema(data));
    const res = await this.request(print(formifiedQuery), { variables });
    const result = Object.values(res)[0];
    const mutation = mutationGenerator(
      variables,
      // @ts-ignore
      Object.values(res)[0],
      buildClientSchema(data)
    );
    return {
      queryString: print(mutation),
      variables: {
        relativePath: variables.relativePath,
        // @ts-ignore
        params: await this.transformPayload({
          payload: result.values,
          form: result.form,
        }),
      },
    };
  };

  generateQuery = async (variables: {
    relativePath: string;
    section: string;
  }) => {
    const data = await this.request(getIntrospectionQuery(), {
      variables: {},
    });
    const query = queryGenerator(variables, buildClientSchema(data));
    return {
      queryString: print(query),
      variables: { relativePath: variables.relativePath },
    };
  };

  listDocumentsBySection = async ({ section }: { section: string }) => {
    const query = `
    query DocumentQuery($section: String!) {
      documents(section: $section) {
        relativePath
        breadcrumbs(excludeExtension: true)
      }
    }
    `;
    const result = await this.request(query, { variables: { section } });

    return result.documents;
  };

  listSections = async () => {
    const query = `
    {
      getSections {
        slug
        documents {
          relativePath
          breadcrumbs
        }
      }
    }
    `;
    const result = await this.request(query, { variables: {} });

    return result.getSections;
  };

  getContent = async <T>({
    path,
  }: {
    path?: string;
  }): Promise<{
    data: T;
  }> => {
    const query = await this.getQuery();
    const data = await this.request(query, {
      variables: { path },
    });

    return data;
  };
  getContentForSection = async <T>({
    relativePath,
    section,
  }: {
    relativePath?: string;
    section?: string;
  }): Promise<T> => {
    const query = await this.getSectionQuery();
    const data = await this.request(query, {
      variables: { relativePath, section },
    });

    return data;
  };

  transformPayload = async ({
    payload,
    form,
  }: {
    payload: any;
    form: { fields: Field[] };
  }) => {
    const data = await this.request(getIntrospectionQuery(), {
      variables: {},
    });
    return transformPayload(payload, form, buildClientSchema(data));
  };

  updateContent = async ({
    relativePath,
    section,
    payload,
    form,
  }: {
    relativePath: string;
    section: string;
    payload: any;
    form: { fields: Field[] };
  }) => {
    const mutation = `mutation updateDocumentMutation($relativePath: String!, $section: String!, $params: DocumentInput) {
      updateDocument(relativePath: $relativePath, section: $section, params: $params) {
        __typename
      }
    }`;
    const values = this.transformPayload(payload, form);
    const variables = { relativePath, section, params: values };

    await this.request<UpdateVariables>(mutation, {
      // @ts-ignore
      variables,
    });
  };

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

  async requestWithForm<VariableType>({
    query,
    variables,
  }: {
    query: DocumentNode;
    variables: VariableType;
  }) {
    const data = await this.request(getIntrospectionQuery(), {
      variables: {},
    });
    const formifiedQuery = formBuilder(query, buildClientSchema(data));

    const body = {
      query: print(formifiedQuery),
      variables,
    };
    const res = await fetch(this.serverURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + this.getToken(),
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (json.errors) {
      console.error(json.errors);
      // throw new Error("Failed to fetch API");
    }
    return json.data;
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
}

export { useForestryForm, useForestryForm2 } from "./useForestryForm";

export { ForestryMediaStore } from "./media-store";

export const DEFAULT_LOCAL_TINA_GQL_SERVER_URL =
  "http://localhost:4001/graphql";
