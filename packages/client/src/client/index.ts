import { friendlyFMTName, queryBuilder } from "@forestryio/graphql-helpers";
import { getIntrospectionQuery, buildClientSchema, print } from "graphql";
import { authenticate, AUTH_COOKIE_NAME } from "../auth/authenticate";
import { transformPayload } from "./handle";
import type { Field } from "tinacms";
import Cookies from "js-cookie";
const DEFAULT_REDIRECT_URI = "http://localhost:2999/authenticating";

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

const DEFAULT_TINA_GQL_SERVER = "http://localhost:4001/graphql";
const DEFAULT_TINA_OAUTH_HOST = "http://localhost:4444";
const DEFAULT_IDENTITY_HOST = "http://localhost:3000";

interface ServerOptions {
  gqlServer?: string;
  oauthHost?: string;
  identityHost?: string;
  redirectURI?: string;
  getTokenFn?: () => string,
}

export class ForestryClient {
  serverURL: string;
  oauthHost: string;
  identityHost: string;
  clientId: string;
  query: string;
  redirectURI: string
  getToken: () => string
  constructor(clientId: string, options?: ServerOptions) {
    this.serverURL = options?.gqlServer || DEFAULT_TINA_GQL_SERVER;
    this.oauthHost = options?.oauthHost || DEFAULT_TINA_OAUTH_HOST;
    this.identityHost = options?.identityHost || DEFAULT_IDENTITY_HOST;
    this.getToken = options?.getTokenFn || function() {
      return Cookies.get(AUTH_COOKIE_NAME)
    }
    this.redirectURI = options?.redirectURI || DEFAULT_REDIRECT_URI
    this.getToken = options?.getTokenFn || function() {
      return Cookies.get(AUTH_COOKIE_NAME)
    }

    this.clientId = clientId;
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
    return transformPayload(payload, form);
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
    const values = transformPayload(payload, form);
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
    return authenticate(this.clientId, this.oauthHost,this.redirectURI);
  }

  async getUser() {
    const url = `${this.identityHost}/me`;

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

  private async request<VariableType>(
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
      throw new Error("Failed to fetch API");
    }
    return json.data;
  }
}

export { useForestryForm } from "./useForestryForm";

export { ForestryMediaStore } from "./media-store";
