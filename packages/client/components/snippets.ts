const getQuery = (arg, spaceCount) => {
  const { operationDataList } = arg;
  const { query } = operationDataList[0];
  const anonymousQuery = query.replace(/query\s.+{/gim, `{`);
  return (
    ` `.repeat(spaceCount) +
    anonymousQuery.replace(/\n/g, `\n` + ` `.repeat(spaceCount))
  );
};

const documentQuery = {
  name: `Document query`,
  language: `JavaScript`,
  codeMirrorMode: `jsx`,
  options: [],
  generate: (
    arg
  ) => `import { forestryFetch, useForestryForm } from "@forestry/client";

const path = <Path-to-content-file>
const response = await forestryFetch<DocumentUnion>({
  \`${getQuery(arg, 2)}\`,
  path,
});
const [formData, form] = useForestryForm(props.response, useForm);
usePlugin(form);

export default <MyPage document={formData} />
`,
};

export default [documentQuery];
