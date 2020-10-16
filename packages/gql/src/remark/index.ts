import unified from "unified";
import remark2rehype from "remark-rehype";
import html from "rehype-stringify";
import markdown from "remark-parse";
import removePosition from "unist-util-remove-position";

export const toHTML = async ({ contents: c }: { contents: string }) => {
  var compiler = unified().use(markdown).use(remark2rehype).use(html);

  const { contents } = compiler.processSync({ contents: c });

  return contents as string;
};

export const toAst = async ({ contents }: { contents: string }) => {
  var tree = unified().use(markdown, {}).parse(contents);

  removePosition(tree, true);

  return tree;
};
