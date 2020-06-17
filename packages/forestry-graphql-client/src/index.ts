const transform = (obj: any) => {
  if (!obj) {
    return "";
  }
  if (typeof obj == "string" || typeof obj === "number") {
    return obj;
  }
  const { _template, __typename, ...rest } = obj;
  if (_template && __typename) {
    return { [__typename.replace("Data", "Input")]: transform(rest) };
  }

  // FIXME unreliable
  if (obj.hasOwnProperty("path")) {
    return obj.path;
  }

  const meh = {};
  Object.keys(rest).forEach((key) => {
    if (key === "section") {
      console.log(rest);
    }
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
  const data = await fetchAPI(mutation, {
    variables: { path: path, params: transformedPayload },
  });
  console.log("fetched", data);
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
    if (key === "section") {
      meh[key] = "posts";
    } else if (Array.isArray(rest[key])) {
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
    if (key === "section") {
      meh[key] = document.data.blocks[2].section;
    } else if (Array.isArray(rest[key])) {
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
