/**
Copyright 2021 Forestry.io Holdings, Inc.
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
