import { matter } from "../util";
import fs from "fs";
import flatten from "lodash.flatten";
import { GraphQLList, GraphQLUnionType, GraphQLString } from "graphql";
import { friendlyName } from "../formatFmt";
import { PluginFieldArgs, Plugin } from "../fieldTypes";

function isNotNull<T>(arg: T): arg is Exclude<T, null> {
  return arg !== null;
}

const select = ({
  fmt,
  rootPath,
  field,
  templatePages,
  templates,
  sectionFmts,
}: PluginFieldArgs) => {
  return {
    type: GraphQLList(
      new GraphQLUnionType({
        name: friendlyName(field.name + "_select_" + fmt),
        // FIXME: this should just be the templates for the relevant section
        types: () => {
          const types = Object.values(templates).filter(isNotNull);

          return types;
        },
        resolveType: async (val) => {
          return templates[val.template];
        },
      })
    ),
    resolve: async (val: any) => {
      const sectionTemplates = sectionFmts.find(
        ({ name }: { name: string }) => name === val.section
      )?.templates;

      // FIXME: this is cheating, we're using 'limit' which I made sure was on the FMT
      const pages = flatten(
        sectionTemplates?.map(
          (sectionTemplateName: string) =>
            templatePages?.find(({ name }) => name === sectionTemplateName)
              ?.pages
        )
      ).slice(0, val.limit);

      return await Promise.all(
        pages.map(async (page) => {
          const res = matter(await fs.readFileSync(rootPath + "/" + page));
          const activeTemplate = templatePages.find(
            ({ pages }: { pages: any }) => {
              return pages?.includes(page);
            }
          );
          return {
            ...res,
            path: page,
            template: activeTemplate?.name,
          };
        })
      );
    },
  };
};

const plugins = [
  {
    type: "select",
    matches: (field: any) => {
      if (field.name === "section") {
        return true;
      } else {
        return false;
      }
    },
    function: select,
  },
];

export const pluginsList: Plugin = {
  matches: (type, field) => {
    const plugin = plugins.find(
      ({ type: pluginType }: { type: string }) => pluginType === type
    );
    if (plugin?.matches(field)) {
      return true;
    } else {
      return false;
    }
  },
  run: (type, stuff) => {
    const plugin = plugins.find(
      ({ type: pluginType }: { type: string }) => pluginType === type
    );
    // FIXME: handle undefined properly
    return plugin?.function(stuff) || { type: GraphQLString };
  },
};
