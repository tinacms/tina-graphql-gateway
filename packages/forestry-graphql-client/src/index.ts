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
    // console.log(JSON.stringify(variables, null, 2));
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

export const prepareValues = (values: any) => {
  console.log("prep", values);

  return values;
};
