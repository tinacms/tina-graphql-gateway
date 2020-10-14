import type {
      DocumentNode,
      GraphQLFieldConfigMap,
      UnionTypeDefinitionNode,
      ObjectTypeDefinitionNode,
    } from "graphql";

    const d: DocumentNode = {
  "kind": "Document",
  "definitions": [
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Query"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "document"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "DocumentUnion"
            }
          },
          "arguments": [
            {
              "kind": "InputValueDefinition",
              "name": {
                "kind": "Name",
                "value": "path"
              },
              "type": {
                "kind": "NamedType",
                "name": {
                  "kind": "Name",
                  "value": "String"
                }
              }
            }
          ]
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Mutation"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "updateDocument"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "DocumentUnion"
            }
          },
          "arguments": [
            {
              "kind": "InputValueDefinition",
              "name": {
                "kind": "Name",
                "value": "path"
              },
              "type": {
                "kind": "NamedType",
                "name": {
                  "kind": "Name",
                  "value": "String"
                }
              }
            },
            {
              "kind": "InputValueDefinition",
              "name": {
                "kind": "Name",
                "value": "params"
              },
              "type": {
                "kind": "NamedType",
                "name": {
                  "kind": "Name",
                  "value": "DocumentInput"
                }
              }
            }
          ]
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Sidecar_Cta_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "header"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionVideo_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "template"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "url"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionNewsletter_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "template"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "body"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "footer"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionPageReference_ButtonSettings_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionPageReference_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "template"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "page"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "button_settings"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "ActionPageReference_ButtonSettings_InputData"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionVideoActionNewsletterActionPageReference_DocumentInput"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "ActionVideo_InputData"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "ActionVideo_InputData"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "ActionNewsletter_InputData"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "ActionNewsletter_InputData"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "ActionPageReference_InputData"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "ActionPageReference_InputData"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Sidecar_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "template"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "text"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "image"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "cta"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Sidecar_Cta_InputData"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "actions"
          },
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "ActionVideoActionNewsletterActionPageReference_DocumentInput"
              }
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "style"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ExcerptPost_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "template"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "post"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "style"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PostList_Posts_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "post"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PostList_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "template"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "posts"
          },
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "PostList_Posts_InputData"
              }
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PriceList_Prices_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "title"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "bullet_points"
          },
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "category"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PriceList_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "template"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "heading"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "prices"
          },
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "PriceList_Prices_InputData"
              }
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "AuthorList_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "template"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "authors"
          },
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SponsorList_Sponsor_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "url"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "image"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SponsorList_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "template"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "sponsor"
          },
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "SponsorList_Sponsor_InputData"
              }
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PageReference_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "template"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "page"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SectionIndex_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "template"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "body"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "limit"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "section"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SidecarExcerptPostPostListPriceListAuthorListSponsorListPageReferenceSectionIndex_DocumentInput"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "Sidecar_InputData"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Sidecar_InputData"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "ExcerptPost_InputData"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "ExcerptPost_InputData"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "PostList_InputData"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "PostList_InputData"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "PriceList_InputData"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "PriceList_InputData"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "AuthorList_InputData"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "AuthorList_InputData"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "SponsorList_InputData"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "SponsorList_InputData"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "PageReference_InputData"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "PageReference_InputData"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "SectionIndex_InputData"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "SectionIndex_InputData"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "BlockPage_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "title"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "date"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "blocks"
          },
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "SidecarExcerptPostPostListPriceListAuthorListSponsorListPageReferenceSectionIndex_DocumentInput"
              }
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "BlockPage_Input"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "data"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "BlockPage_InputData"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "content"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Post_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "title"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "author"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "image"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "hashtags"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Post_Input"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "data"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Post_InputData"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "content"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Author_Accolades_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "figure"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Author_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "image"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "gallery"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "anecdotes"
          },
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "accolades"
          },
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Author_Accolades_InputData"
              }
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Author_Input"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "data"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Author_InputData"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "content"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Menu_MenuItem_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "page"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Menu_InputData"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "logo"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "menu_item"
          },
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Menu_MenuItem_InputData"
              }
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Menu_Input"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "data"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Menu_InputData"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "content"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          }
        }
      ]
    },
    {
      "kind": "InputObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "DocumentInput"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "BlockPage_Input"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "BlockPage_Input"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "Post_Input"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Post_Input"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "Author_Input"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Author_Input"
            }
          }
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "Menu_Input"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Menu_Input"
            }
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "TextField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "DatetimeField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "TextareaField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "FileField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Sidecar_Cta_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Sidecar_Cta_GroupField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Sidecar_Cta_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionVideo_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionVideo_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "ActionVideo_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionNewsletter_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextareaField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionNewsletter_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "ActionNewsletter_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SelectField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "options"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionPageReference_ButtonSettings_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionPageReference_ButtonSettings_GroupField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "ActionPageReference_ButtonSettings_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionPageReference_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SelectField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "ActionPageReference_ButtonSettings_GroupField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionPageReference_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "ActionPageReference_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Sidecar_Actions_BlocksFieldTemplates"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "actionVideo"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "ActionVideo_Form"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "actionNewsletter"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "ActionNewsletter_Form"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "actionPageReference"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "ActionPageReference_Form"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Sidecar_Actions_BlocksField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "templates"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Sidecar_Actions_BlocksFieldTemplates"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Sidecar_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextareaField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "FileField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "Sidecar_Cta_GroupField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "Sidecar_Actions_BlocksField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SelectField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Sidecar_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Sidecar_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ExcerptPost_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SelectField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextareaField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ExcerptPost_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "ExcerptPost_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PostList_Posts_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SelectField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PostList_Posts_GroupListField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "PostList_Posts_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PostList_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "PostList_Posts_GroupListField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PostList_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "PostList_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "List_FormFieldsUnion"
      },
      "directives": [],
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextareaField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SelectField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ListField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "defaultItem"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "field"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "List_FormFieldsUnion"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PriceList_Prices_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextareaField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "ListField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SelectField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PriceList_Prices_GroupListField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "PriceList_Prices_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PriceList_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextareaField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "PriceList_Prices_GroupListField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PriceList_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "PriceList_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "AuthorList_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "ListField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "AuthorList_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "AuthorList_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SponsorList_Sponsor_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "FileField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SponsorList_Sponsor_GroupListField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "SponsorList_Sponsor_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SponsorList_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextareaField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SponsorList_Sponsor_GroupListField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SponsorList_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "SponsorList_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PageReference_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextareaField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SelectField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PageReference_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "PageReference_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "NumberField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SectionIndex_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextareaField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "NumberField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SelectField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SectionIndex_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "SectionIndex_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "BlockPage_Blocks_BlocksFieldTemplates"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "sidecar"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Sidecar_Form"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "excerptPost"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "ExcerptPost_Form"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "postList"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "PostList_Form"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "priceList"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "PriceList_Form"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "authorList"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "AuthorList_Form"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "sponsorList"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "SponsorList_Form"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "pageReference"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "PageReference_Form"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "sectionIndex"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "SectionIndex_Form"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "BlockPage_Blocks_BlocksField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "templates"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "BlockPage_Blocks_BlocksFieldTemplates"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "BlockPage_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "DatetimeField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "BlockPage_Blocks_BlocksField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "BlockPage_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "BlockPage_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Sidecar_Cta_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "header"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionVideo_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "url"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionNewsletter_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "body"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "footer"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Pages_DocumentUnion"
      },
      "directives": [],
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "BlockPage"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionPageReference_ButtonSettings_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionPageReference_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "page"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Pages_DocumentUnion"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "button_settings"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "ActionPageReference_ButtonSettings_Data"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionVideo_ActionNewsletter_ActionPageReference_DataUnion"
      },
      "directives": [],
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "ActionVideo_Data"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "ActionNewsletter_Data"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "ActionPageReference_Data"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Sidecar_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "text"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "image"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "cta"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Sidecar_Cta_Data"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "actions"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "ActionVideo_ActionNewsletter_ActionPageReference_DataUnion"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "style"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Posts_DocumentUnion"
      },
      "directives": [],
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "Post"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ExcerptPost_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "post"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Posts_DocumentUnion"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "style"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PostList_Posts_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "post"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Posts_DocumentUnion"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PostList_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "posts"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "PostList_Posts_Data"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PriceList_Prices_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "title"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "bullet_points"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "category"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PriceList_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "heading"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "prices"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "PriceList_Prices_Data"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Authors_DocumentUnion"
      },
      "directives": [],
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "Author"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "AuthorList_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "authors"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Authors_DocumentUnion"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SponsorList_Sponsor_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "url"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "image"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SponsorList_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "sponsor"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "SponsorList_Sponsor_Data"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PageReference_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "page"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Pages_DocumentUnion"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SectionIndex_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "body"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "limit"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "section"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Sidecar_ExcerptPost_PostList_PriceList_AuthorList_SponsorList_PageReference_SectionIndex_DataUnion"
      },
      "directives": [],
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "Sidecar_Data"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "ExcerptPost_Data"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "PostList_Data"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "PriceList_Data"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "AuthorList_Data"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SponsorList_Data"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "PageReference_Data"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SectionIndex_Data"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "BlockPage_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "title"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "date"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "blocks"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Sidecar_ExcerptPost_PostList_PriceList_AuthorList_SponsorList_PageReference_SectionIndex_DataUnion"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Sidecar_Cta_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "header"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionVideo_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "url"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionNewsletter_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "body"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "footer"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionPageReference_ButtonSettings_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionPageReference_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "page"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "button_settings"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "ActionPageReference_ButtonSettings_InitialValues"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ActionVideo_ActionNewsletter_ActionPageReference_InitialValuesUnion"
      },
      "directives": [],
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "ActionVideo_InitialValues"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "ActionNewsletter_InitialValues"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "ActionPageReference_InitialValues"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Sidecar_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "text"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "image"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "cta"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Sidecar_Cta_InitialValues"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "actions"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "ActionVideo_ActionNewsletter_ActionPageReference_InitialValuesUnion"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "style"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ExcerptPost_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "post"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "style"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PostList_Posts_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "post"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PostList_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "posts"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "PostList_Posts_InitialValues"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PriceList_Prices_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "title"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "bullet_points"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "category"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PriceList_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "heading"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "prices"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "PriceList_Prices_InitialValues"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "AuthorList_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "authors"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SponsorList_Sponsor_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "url"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "image"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SponsorList_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "sponsor"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "SponsorList_Sponsor_InitialValues"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "PageReference_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "page"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "SectionIndex_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "body"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "limit"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "section"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Sidecar_ExcerptPost_PostList_PriceList_AuthorList_SponsorList_PageReference_SectionIndex_InitialValuesUnion"
      },
      "directives": [],
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "Sidecar_InitialValues"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "ExcerptPost_InitialValues"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "PostList_InitialValues"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "PriceList_InitialValues"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "AuthorList_InitialValues"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SponsorList_InitialValues"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "PageReference_InitialValues"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SectionIndex_InitialValues"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "BlockPage_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "title"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "date"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "blocks"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Sidecar_ExcerptPost_PostList_PriceList_AuthorList_SponsorList_PageReference_SectionIndex_InitialValuesUnion"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "BlockPage"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "path"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "form"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "BlockPage_Form"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "data"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "BlockPage_Data"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "initialValues"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "BlockPage_InitialValues"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "TagListField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Post_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SelectField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "FileField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TagListField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Post_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Post_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Post_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "title"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "author"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Authors_DocumentUnion"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "image"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "hashtags"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Post_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "title"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "author"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "image"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "hashtags"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Post"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "path"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "form"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Post_Form"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "data"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Post_Data"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "initialValues"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Post_InitialValues"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "ImageGalleryField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Author_Accolades_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Author_Accolades_GroupListField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Author_Accolades_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Author_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "FileField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "ImageGalleryField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "ListField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "Author_Accolades_GroupListField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Author_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Author_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Author_Accolades_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "figure"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Author_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "image"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "gallery"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "anecdotes"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "accolades"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Author_Accolades_Data"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Author_Accolades_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "figure"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "description"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Author_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "image"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "gallery"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "anecdotes"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "accolades"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Author_Accolades_InitialValues"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Author"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "path"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "form"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Author_Form"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "data"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Author_Data"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "initialValues"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Author_InitialValues"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Menu_MenuItem_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "TextField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "SelectField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Menu_MenuItem_GroupListField"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "component"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Menu_MenuItem_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Menu_FormFields"
      },
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "FileField"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "Menu_MenuItem_GroupListField"
          }
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Menu_Form"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "fields"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Menu_FormFields"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Menu_MenuItem_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "page"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Pages_DocumentUnion"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Menu_Data"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "logo"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "menu_item"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Menu_MenuItem_Data"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Menu_MenuItem_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "_template"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "label"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "page"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Menu_InitialValues"
      },
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "logo"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "menu_item"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Menu_MenuItem_InitialValues"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Menu"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "path"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "form"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Menu_Form"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "data"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Menu_Data"
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "initialValues"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Menu_InitialValues"
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "DocumentUnion"
      },
      "directives": [],
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "BlockPage"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "Post"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "Author"
          }
        },
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "Menu"
          }
        }
      ]
    }
  ]
}