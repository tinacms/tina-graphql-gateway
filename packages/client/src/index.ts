import { friendlyFMTName } from "@forestryio/graphql";

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

  const meh = {};
  Object.keys(rest).forEach((key) => {
    if (Array.isArray(rest[key])) {
      meh[key] = rest[key].map((item) => {
        return transform(item);
      });
    } else {
      meh[key] = transform(rest[key]);
    }
  });

  return meh;
};

interface GetContentVariables {
  path: string;
}

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

interface ForestryClientOptions {
  serverURL: string;
}

export class ForestryClient {
  serverURL: string;
  constructor({ serverURL }: ForestryClientOptions) {
    this.serverURL = serverURL;
  }

  addContent = async ({ url, path, template, payload }: AddProps) => {
    const mutation = `mutation addDocumentMutation($path: String!, $template: String!, $params: DocumentInput) {
      addDocument(path: $path, template: $template, params: $params) {
        __typename
      }
    }`;

    const transformedPayload = transform({
      _template: friendlyFMTName(template, { suffix: "field_config" }),
      data: payload,
    });

    await this.request<AddVariables>(url, mutation, {
      variables: {
        path: path,
        template: template + ".yml",
        params: transformedPayload,
      },
    });
  };

  getContent = async ({ query, path }) => {
    const data = await this.request(this.serverURL, query, {
      variables: { path },
    });

    const formConfig = {
      id: path,
      label: path,
      initialValues: data.document.data,
      fields: data.document.form.fields,
    };

    return {
      data,
      formConfig,
    };
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

    await this.request<UpdateVariables>(this.serverURL, mutation, {
      variables: { path: path, params: transformedPayload },
    });
  };

  private async request<VariableType>(
    url: string,
    query: string,
    { variables }: { variables: VariableType }
  ) {
    const res = await fetch(url, {
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
