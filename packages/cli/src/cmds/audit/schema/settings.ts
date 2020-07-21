export const ForestrySettingsSchema = {
  title: "Forestry Settings Schema",
  type: "object",
  description: "Todo item sent by the client",
  properties: {
    new_page_extension: {
      title: "New file format",
      description:
        "New files created in Forestry can be Markdown or HTM\n\nFor example: HERE WE GO",
      type: "string",
      enum: ["md", "html"],
    },
    auto_deploy: {
      title: "",
      description: "",
      type: "boolean",
    },
    admin_path: {
      title: "Admin Path",
      description: "The folder where you store the Forestry admin file.",
      type: "string",
    },
    webhook_url: {
      title: "Webhook URL",
      description:
        "Forestry can send events to a webhook (ie. post_import, post_publish)",
      type: "string",
    },
    version: {
      title: "Schema version",
      type: "string",
    },
    upload_dir: {
      type: "string",
      title: "Upload Directory",
      description: "The directory where media is stored inside of git",
    },
    public_path: {
      type: "string",
      title: "Public Path",
      description: "The path where media is served from",
    },
    front_matter_path: {
      type: "string",
      title: "Front Matter Path",
      description: "",
    },
    use_front_matter_path: {
      type: "boolean",
      title: "Use Front Matter Path",
      description: "Override the public path for front matter fields.",
    },
    file_template: {
      type: "string",
      title: "File Path",
      description:
        "The path where media will be uploaded and served from.\n\nAvailable variables: :filename:, :year:, :month:, :day:.",
    },
    build: {
      type: "object",
      title: "Webhook URL",
      description:
        "Forestry can send events to a webhook (ie. post_import, post_publish)",
      properties: {
        install_dependencies_command: {
          type: "string",
          title: "Install Dependencies Command",
          description:
            "The command that installs your project dependencies, if necessary. The results of this command will be cached for faster startup times.",
        },
        preview_docker_image: {
          type: "string",
          title: "Preview Docker Image",
          description: "Path to a publicly available image on Docker hub",
        },
        mount_path: {
          type: "string",
          title: "Mount Path",
          description:
            "The directory inside the docker container where your site should be mounted.",
        },
        working_dir: {
          type: "string",
          title: "Working Directory",
          description:
            "Override the default working directory of the docker image",
        },
        instant_preview_command: {
          type: "string",
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
            type: "string",
            title: "Type",
            description: "",
            enum: ["directory", "heading", "document"],
          },
          path: {
            type: "string",
            title: "Path",
          },
          label: {
            type: "string",
            title: "Label",
            description: "",
          },
          create: {
            type: "string",
            title: "Create",
            description: "",
          },
          match: {
            type: "string",
            title: "Match",
            description: "",
          },
          exclude: {
            type: "string",
            title: "",
            description: "",
          },
          new_doc_ext: {
            type: "string",
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
              type: "string",
              title: "Webhook URL",
              description:
                "Forestry can send events to a webhook (ie. post_import, post_publish)",
            },
          },
        },
        required: ["type", "label"],
        additionalProperties: false,
      },
    },
  },
  required: ["new_page_extension", "sections"],
  additionalProperties: false,
};
