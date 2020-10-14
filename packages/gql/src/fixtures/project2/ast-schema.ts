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
        "value": "Section_Cta_InputData"
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
        "value": "Section_InputData"
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
            "value": "cta"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Section_Cta_InputData"
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
        "value": "Section_DocumentInput"
      },
      "fields": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "Section_InputData"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Section_InputData"
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
            "value": "sections"
          },
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Section_DocumentInput"
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
            "value": "role"
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
        "value": "DocumentInput"
      },
      "fields": [
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
        "value": "Section_Cta_FormFields"
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
        "value": "Section_Cta_GroupField"
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
                "value": "Section_Cta_FormFields"
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
        "value": "Section_FormFields"
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
            "value": "Section_Cta_GroupField"
          }
        },
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
        "value": "Section_Form"
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
                "value": "Section_FormFields"
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
        "value": "Post_Sections_BlocksFieldTemplates"
      },
      "interfaces": [],
      "directives": [],
      "fields": [
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
              "value": "Section_Form"
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
        "value": "Post_Sections_BlocksField"
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
              "value": "Post_Sections_BlocksFieldTemplates"
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
            "value": "TextareaField"
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
            "value": "Post_Sections_BlocksField"
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
        "value": "Section_Cta_Data"
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
        "value": "Section_Data"
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
            "value": "cta"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Section_Cta_Data"
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
                "value": "Authors_DocumentUnion"
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
        "value": "Section_DataUnion"
      },
      "directives": [],
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "Section_Data"
          }
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
            "value": "sections"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Section_DataUnion"
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
        "value": "Section_Cta_InitialValues"
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
        "value": "Section_InitialValues"
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
            "value": "cta"
          },
          "arguments": [],
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Section_Cta_InitialValues"
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
      "kind": "UnionTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Section_InitialValuesUnion"
      },
      "directives": [],
      "types": [
        {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "Section_InitialValues"
          }
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
            "value": "sections"
          },
          "arguments": [],
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Section_InitialValuesUnion"
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
            "value": "TextareaField"
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
            "value": "TextareaField"
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
            "value": "role"
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
            "value": "role"
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
        "value": "DocumentUnion"
      },
      "directives": [],
      "types": [
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
        }
      ]
    }
  ]
}