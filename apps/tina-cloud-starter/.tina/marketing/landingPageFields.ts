import { TinaField } from "tina-graphql-gateway-cli";

export const landingPageFields: TinaField[] = [
  {
    type: "blocks",
    name: "blocks",
    label: "Blocks",
    templates: [
      {
        name: "message",
        label: "Message",
        fields: [
          {
            type: "text",
            label: "Message Header",
            name: "messageHeader",
          },
          {
            type: "textarea",
            label: "Message Body",
            name: "messageBody",
          },
        ],
      },
      {
        name: "diagram",
        label: "Diagram",
        fields: [
          {
            type: "text",
            label: "Diagram Heading",
            name: "diagramHeading",
          },
          {
            type: "textarea",
            label: "Diagram Description",
            name: "diagramDescription",
          },
          {
            type: "text",
            label: "Diagram ID",
            name: "diagramID",
          },
        ],
      },
    ],
  },
];
