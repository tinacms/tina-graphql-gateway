import unified from "unified";
import remark2rehype from "remark-rehype";
import htmlStringify from "rehype-stringify";
import parse from "remark-parse";
import mdx from "remark-mdx";
import removePosition from "unist-util-remove-position";

export const toHTML = async ({ contents: c }: { contents: string }) => {
  var compiler = unified().use(parse).use(remark2rehype).use(htmlStringify);

  const { contents } = compiler.processSync({ contents: c });

  return contents as string;
};

export const toAst = async ({ contents }: { contents: string }) => {
  var tree = unified().use(parse).use(mdx).parse(contents);

  removePosition(tree, true);

  return tree;
};
