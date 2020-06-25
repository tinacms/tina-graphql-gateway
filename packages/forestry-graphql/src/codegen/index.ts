import fs from "fs";
import path from "path";
import { parse, printSchema } from "graphql";
import { codegen } from "@graphql-codegen/core";
import { plugin as typescriptPlugin } from "@graphql-codegen/typescript";
import { plugin as typescriptOperationsPlugin } from "@graphql-codegen/typescript-operations";

export const generateTypes = async (path: any, schema: any) => {
  try {
    const res = await codegen({
      filename: path.resolve(__dirname + "/../src/schema.ts"),
      schema: parse(printSchema(schema)),
      documents: [
        {
          location: "operation.graphql",
          document: parse(query),
        },
      ],
      config: {},
      plugins: [{ typescript: {} }, { typescriptOperations: {} }],
      pluginMap: {
        typescript: {
          plugin: typescriptPlugin,
        },
        typescriptOperations: {
          plugin: typescriptOperationsPlugin,
        },
      },
    });
    await fs.writeFileSync(
      path.resolve(process.cwd() + "/.forestry/types.ts"),
      `// DO NOT MODIFY THIS FILE. This file is automatically generated by Forestry
    ${res}
        `
    );
  } catch (e) {
    console.error(e);
  }
};

// NOTE: this should be derived automatically
const query = `query DocumentQuery($path: String!) {
  document(path: $path) {
    __typename
    ... on Post {
      __typename
      form {
        fields {
          ... on SelectFormField {
            name
            options
          }
        }
      }
      path
      content
      excerpt
      data {
        title
        image {
          path
          absolutePath
        }
        hashtags
        author {
          ... on Author {
            path
            data {
              name
              image {
                path
                absolutePath
              }
            }
          }
        }
      }
    }
    ... on BlockPage {
      form {
        fields {
          __typename
          ... on TextFormField {
            name
            label
            component
          }
          ... on BlocksFieldConfig {
            name
            label
            component
            templates {
              AuthorListFieldConfig {
                label
                key
                fields {
                  ... on AuthorsListAuthorListConfig {
                    name
                    label
                    component
                    fields {
                      name
                      options
                      component
                      label
                    }
                  }
                }
              }
              SponsorListFieldConfig {
                label
                key
                fields {
                  ... on TextFormField {
                    name
                    label
                    component
                  }
                  ... on SponsorFieldsListSponsorListConfig {
                    label
                    key
                    name
                    component
                    fields {
                      ... on TextFormField {
                        name
                        label
                        component
                      }
                      ... on ImageFormField {
                        name
                        component
                        fields {
                          name
                          label
                          component
                        }
                      }
                    }
                  }
                }
              }
              PageReferenceFieldConfig {
                label
                key
                fields {
                  ... on TextFormField {
                    name
                    label
                    component
                  }
                  ... on SelectFormField {
                    name
                    label
                    component
                    options
                  }
                }
              }
              SidecarFieldConfig {
                label
                key
                fields {
                  ... on TextFormField {
                    name
                    label
                    component
                  }
                  ... on ImageFormField {
                    name
                    component
                    fields {
                      name
                      label
                      component
                    }
                  }
                  ... on CtaFieldsListSidecarConfig {
                    label
                    key
                    component
                    name
                    fields {
                      ... on TextFormField {
                        name
                        label
                        component
                      }
                    }
                  }
                  ... on ActionsFieldConfig {
                    name
                    label
                    component
                    templates {
                      ActionVideoFieldConfig {
                        label
                        key
                        fields {
                          ... on TextFormField {
                            label
                            name
                            component
                          }
                        }
                      }
                      ActionNewsletterFieldConfig {
                        label
                        key
                        fields {
                          ... on TextFormField {
                            label
                            name
                            component
                          }
                        }
                      }
                      ActionPageReferenceFieldConfig {
                        label
                        key
                        fields {
                          ... on SelectFormField {
                            name
                            label
                            component
                            options
                          }
                          ... on ButtonSettingsFieldsListActionPageReferenceConfig {
                            label
                            key
                            name
                            component
                            fields {
                              ... on TextFormField {
                                name
                                label
                                component
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  ... on SelectFormField {
                    name
                    label
                    component
                    options
                  }
                }
              }
              SectionIndexFieldConfig {
                label
                key
                fields {
                  ... on TextFormField {
                    name
                    label
                    component
                  }
                  ... on SelectFormField {
                    name
                    label
                    component
                    options
                  }
                }
              }
              PriceListFieldConfig {
                label
                key
                fields {
                  ... on TextFormField {
                    name
                    label
                    component
                  }
                  ... on PricesFieldsListPriceListConfig {
                    label
                    key
                    component
                    name
                    fields {
                      ... on TextFormField {
                        name
                        label
                        component
                      }
                      ... on BulletPointsListPriceListPricesConfig {
                        name
                        label
                        component
                        itemField {
                          name
                          label
                          component
                        }
                      }
                      ... on SelectFormField {
                        name
                        label
                        options
                        component
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      data {
        __typename
        _template
        title
        blocks {
          __typename
          ... on ExcerptPostData {
            __typename
            _template
            style
            post {
              __typename
              ... on Post {
                path
                excerpt
                data {
                  image {
                    path
                    absolutePath
                  }
                  title
                  author {
                    ... on Author {
                      data {
                        name
                        image {
                          path
                          absolutePath
                        }
                      }
                    }
                  }
                }
              }
            }
            description
          }
          ... on PageReferenceData {
            _template
            description
            page {
              __typename
              ... on BlockPage {
                path
              }
            }
          }
          ... on SidecarData {
            _template
            style
            text
            image {
              path
              absolutePath
            }
            cta {
              header
            }
            actions {
              ... on ActionPageReferenceData {
                _template
                __typename
                page {
                  ... on BlockPage {
                    path
                  }
                }
                button_settings {
                  label
                }
              }
              ... on ActionVideoData {
                _template
                __typename
                url
              }
              ... on ActionNewsletterData {
                _template
                __typename
                body
                footer
              }
            }
          }
          ... on SponsorListData {
            _template
            description
            sponsor {
              name
              url
              image {
                path
                absolutePath
              }
            }
          }
          ... on AuthorListData {
            _template
            authors {
              __typename
              ... on Author {
                path
                content
                excerpt
                data {
                  name
                  image {
                    path
                    absolutePath
                  }
                  gallery {
                    path
                    absolutePath
                  }
                  anecdotes
                  accolades {
                    figure
                    description
                  }
                }
              }
            }
          }
          ... on PriceListData {
            _template
            heading
            prices {
              title
              description
              bullet_points
              category
            }
          }
          ... on SectionIndexData {
            _template
            body
            limit
          }
        }
      }
    }
  }
}
`;
