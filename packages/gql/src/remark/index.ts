const unified = require("unified");
const remark2rehype = require("remark-rehype");
const html = require("rehype-stringify");
const markdown = require("remark-parse");

export const toHTML = async ({ contents: c }: { contents: string }) => {
  var compiler = unified()
    .use(markdown)
    .use({ settings: { position: false } })
    .use(remark2rehype)
    .use(html);

  const { contents } = compiler.processSync({ contents: c });

  return contents as string;
};

export const toAst = async ({ contents }: { contents: string }) => {
  var tree = unified()
    .use(markdown)
    .use({ settings: { position: false } })
    .parse(contents);

  return tree;
};
