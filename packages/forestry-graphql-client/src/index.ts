const transform = (obj: any) => {
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

export const onSubmit = async ({
  path,
  payload,
}: {
  path: string;
  payload: any;
}) => {
  const mutation = `mutation DocumentMutation($path: String!, $params: DocumentInput) {
    document(path: $path, params: $params) {
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
  await fetchAPI(mutation, {
    variables: { path: path, params: transformedPayload },
  });
};

export const forestryFetch = async ({ query, path }) => {
  const data = await fetchAPI(query, { variables: { path } });

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

export const useForestryForm = ({ data, formConfig }, useForm) => {
  const [formData, form] = useForm({
    ...formConfig,
    onSubmit: (values) => {
      onSubmit({ path: formConfig.id, payload: values });
    },
  });

  const { __typename } = data.document;

  return [
    {
      __typename,
      data: formData,
    },
    form,
  ];
};

const API_URL = "http://localhost:3000/api/graphql";

async function fetchAPI(
  query: string,
  { variables }: { variables: { path: string; params?: any } }
) {
  const res = await fetch(API_URL, {
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
