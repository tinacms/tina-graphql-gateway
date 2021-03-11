/**
Copyright 2021 Forestry.io Inc
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

export const ForestrySettingsSchema = {
  title: "Forestry Settings Schema",
  type: "object",
  description: "Todo item sent by the client",
  required: ["new_page_extension", "upload_dir", "sections"],
  additionalProperties: false,
  properties: {
    new_page_extension: {
      title: "New file format",
      description: "New files created in Forestry can be Markdown or HTML",
      type: gql.TYPES.String,
      enum: ["md", "html"],
    },
    version: {
      title: "Schema version",
      type: gql.TYPES.String,
    },
    auto_deploy: {
      title: "",
      description: "",
      type: "boolean",
    },
    admin_path: {
      title: "Admin Path",
      description: "The folder where you store the Forestry admin file.",
      type: gql.TYPES.String,
    },
    webhook_url: {
      title: "Webhook URL",
      description:
        "Forestry can send events to a webhook (ie. post_import, post_publish)",
      type: gql.TYPES.String,
    },
    upload_dir: {
      type: gql.TYPES.String,
      title: "Upload Directory",
      description: "The directory where media is stored inside of git",
    },
    public_path: {
      type: gql.TYPES.String,
      title: "Public Path",
      description: "The path where media is served from",
    },
    front_matter_path: {
      type: gql.TYPES.String,
      title: "Front Matter Path",
      description: "",
    },
    use_front_matter_path: {
      type: "boolean",
      title: "Use Front Matter Path",
      description: "Override the public path for front matter fields.",
    },
    file_template: {
      type: gql.TYPES.String,
      title: "File Path",
      description:
        "The path where media will be uploaded and served from.\n\nAvailable variables: :filename:, :year:, :month:, :day:.",
    },
    build: {
      type: "object",
      title: "Webhook URL",
      description:
        "Forestry can send events to a webhook (ie. post_import, post_publish)",
      additionalProperties: false,
      properties: {
        install_dependencies_command: {
          type: gql.TYPES.String,
          title: "Install Dependencies Command",
          description:
            "The command that installs your project dependencies, if necessary. The results of this command will be cached for faster startup times.",
        },
        preview_docker_image: {
          type: gql.TYPES.String,
          title: "Preview Docker Image",
          description: "Path to a publicly available image on Docker hub",
        },
        preview_env: {
          type: "array",
          title: "Environment Variables",
          description: "Ex. HUGO_ENV=staging",
          items: {
            type: gql.TYPES.String,
          },
        },
        preview_output_directory: {
          type: gql.TYPES.String,
          title: "Output Directory",
          description:
            "The directory, relative to the root of your project, where your site is output to when previewing.",
        },
        mount_path: {
          type: gql.TYPES.String,
          title: "Mount Path",
          description:
            "The directory inside the docker container where your site should be mounted.",
        },
        working_dir: {
          type: gql.TYPES.String,
          title: "Working Directory",
          description:
            "Override the default working directory of the docker image",
        },
        instant_preview_command: {
          type: gql.TYPES.String,
          title: "Build Command",
          description:
            "The command that starts your static site generator's dev server.",
        },
      },
    },
    sections: {
      type: "array",
      title: "Sidebar",
      description: "Add sections to the sidebar to expose content to editors",
      items: {
        type: "object",
        properties: {
          type: {
            type: gql.TYPES.String,
            enum: ["directory", "heading", "document"],
          },
        },
        allOf: [
          {
            if: {
              properties: {
                type: { const: "heading" },
              },
            },
            then: {
              properties: {
                type: {
                  const: "heading",
                },
                label: {
                  type: gql.TYPES.String,
                },
              },
              required: ["type", "label"],
              additionalProperties: false,
            },
          },
          {
            if: {
              properties: {
                type: { const: "document" },
              },
            },
            then: {
              properties: {
                type: {
                  const: "document",
                },
                label: {
                  type: gql.TYPES.String,
                },
                path: {
                  type: gql.TYPES.String,
                },
                read_only: {
                  type: "boolean",
                },
              },
              required: ["type", "label", "path"],
              additionalProperties: false,
            },
          },
          {
            if: {
              properties: {
                type: { const: "directory" },
              },
            },
            then: {
              properties: {
                type: {
                  const: "directory",
                },
                label: {
                  type: gql.TYPES.String,
                },
                create: {
                  type: gql.TYPES.String,
                  title: "Create",
                  description: "",
                },
                path: {
                  type: gql.TYPES.String,
                },
                match: {
                  type: gql.TYPES.String,
                  title: "Match",
                  description: "",
                },
                exclude: {
                  type: gql.TYPES.String,
                  title: "",
                  description: "",
                },
                new_doc_ext: {
                  type: gql.TYPES.String,
                  title: "New doc",
                  description: "",
                  enum: ["md", "html"],
                },
                templates: {
                  type: "array",
                  title: "Webhook URL",
                  description:
                    "Forestry can send events to a webhook (ie. post_import, post_publish)",
                  items: {
                    type: gql.TYPES.String,
                    title: "Webhook URL",
                    description:
                      "Forestry can send events to a webhook (ie. post_import, post_publish)",
                  },
                },
              },
              required: ["type", "path", "label", "create", "match"],
              additionalProperties: false,
            },
          },
        ],
      },
    },
  },
};
