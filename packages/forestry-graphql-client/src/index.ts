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
  const API_URL = "http://localhost:4001/graphql";

  async function fetchAPI(
    mutation,
    { variables }: { variables: { path: string; params: any } }
  ) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: mutation,
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

const prepare = (obj: any) => {
  if (!obj) {
    return "";
  }
  if (typeof obj == "string" || typeof obj === "number") {
    return obj;
  }
  const { ...rest } = obj;

  const meh = {};
  Object.keys(rest).forEach((key) => {
    if (Array.isArray(rest[key])) {
      meh[key] = rest[key].map((item) => {
        return prepare(item);
      });
    } else {
      meh[key] = prepare(rest[key]);
    }
  });

  return meh;
};
export const prepareValues = (values: any) => {
  const preparedValues = prepare(values);
  // console.log(JSON.stringify(preparedValues, null, 2));

  return preparedValues;
};

const rehydrate = (obj: any, document: any) => {
  if (!obj) {
    return "";
  }
  if (typeof obj == "string" || typeof obj === "number") {
    return obj;
  }
  const { ...rest } = obj;

  const meh = {};
  Object.keys(rest).forEach((key) => {
    if (Array.isArray(rest[key])) {
      meh[key] = rest[key].map((item) => {
        return rehydrate(item, document);
      });
    } else {
      meh[key] = rehydrate(rest[key], document);
    }
  });

  return meh;
};

export const rehydrateValues = (formData, document) => {
  return {
    ...document,
    data: rehydrate(formData, document),
  };
};
