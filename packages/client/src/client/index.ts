import { friendlyFMTName, queryBuilder } from "@forestryio/graphql-helpers";
import { getIntrospectionQuery, buildClientSchema, print } from "graphql";
import { authenticate } from "../auth/authenticate";
import { transformPayload } from "./handle";

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

const DEFAULT_TINA_GQL_SERVER = "http://localhost:4000/demo";
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
  }> => {
    const query = await this.getQuery();
    const data = await this.request(query, {
      variables: { path },
    });

    return data;
  };

  transformPayload = async ({
    path,
    payload,
    form,
  }: {
    path: string;
    payload: any;
    form: { fields: unknown[] };
  }) => {
    // @ts-ignore
    return transformPayload(payload, form);
  };

  updateContent = async ({
    path,
    payload,
    form,
  }: {
    path: string;
    payload: any;
    form: { fields: unknown[] };
  }) => {
    const mutation = `mutation updateDocumentMutation($path: String!, $params: DocumentInput) {
      updateDocument(path: $path, params: $params) {
        __typename
      }
    }`;
    // @ts-ignore
    const values = this.transformPayload(payload, form);

    await this.request<UpdateVariables>(mutation, {
      variables: { path: path, params: values },
    });
  };

  async isAuthorized(): Promise<boolean> {
    return Promise.resolve(true); //TODO - implement me
  }

  async isAuthenticated(): Promise<boolean> {
    return Promise.resolve(false); //TODO - implement me
  }

  async authenticate() {
    return authenticate(this.clientId, this.oauthHost);
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

export { ForestryMediaStore } from "./media-store";
