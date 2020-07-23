import { setupTests } from "../setupTests";

const base = {
  label: "Authors",
  name: "authors",
  type: "list",
};

setupTests({
  "with an empty default": {
    initial: {
      ...base,
      default: [],
      config: {
        use_select: true,
        source: {
          type: "pages",
          section: "authors",
        },
      },
    },
    errors: [],
    fixed: {
      ...base,
      config: {
        use_select: true,
        source: {
          type: "pages",
          section: "authors",
        },
      },
    },
  },
  "with null config items": {
    initial: {
      ...base,
      config: {
        use_select: true,
        min: null,
        max: null,
        source: {
          type: "pages",
          section: "authors",
        },
      },
    },
    errors: [
      {
        dataPath: ".config.min",
        keyword: "type",
      },
      {
        dataPath: ".config.max",
        keyword: "type",
      },
    ],
    fixed: {
      ...base,
      config: {
        use_select: true,
        source: {
          type: "pages",
          section: "authors",
        },
      },
    },
  },
  "with a missing path for documents": {
    initial: {
      ...base,
      config: {
        use_select: true,
        source: {
          type: "documents",
          file: "hugo/data/authors.yml",
          section: "authors",
        },
      },
    },
    errors: [
      {
        dataPath: ".config.source",
        keyword: "required",
      },
    ],
  },
  "with a options for documents list": {
    initial: {
      ...base,
      config: {
        use_select: true,
        options: ["my-options"],
        source: {
          type: "documents",
          file: "hugo/data/authors.yml",
          path: "map",
          section: "authors",
        },
      },
      default: [],
    },
    errors: [
      {
        dataPath: ".config",
        keyword: "additionalProperties",
      },
    ],
    fixed: {
      ...base,
      config: {
        use_select: true,
        source: {
          type: "documents",
          file: "hugo/data/authors.yml",
          path: "map",
          section: "authors",
        },
      },
    },
  },
  "with a datafile source": {
    initial: {
      ...base,
      config: {
        use_select: true,
        source: {
          type: "datafiles",
        },
      },
    },
    errors: [],
    fixed: {
      ...base,
      config: {
        use_select: true,
        source: {
          type: "datafiles",
        },
      },
    },
  },
  // FIXME: this is passing but it's invalid, the "fix" removes the config.source becuase
  // it's treating the value like a text-based list. Need to know more about datafiles
  "with a datafile source while use_select is false": {
    initial: {
      ...base,
      config: {
        use_select: false,
        source: {
          type: "datafiles",
        },
      },
    },
    errors: [
      {
        dataPath: ".config",
        keyword: "additionalProperties",
      },
    ],
    fixed: {
      ...base,
      config: {
        use_select: false,
        // source: {
        //   type: "datafiles",
        // },
      },
    },
  },
});
