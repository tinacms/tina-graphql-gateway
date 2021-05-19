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

import { base, baseRequired } from "../common";

export const NumberField = {
  $id: "#numberField",
  label: "Number Field",
  description:
    "A number input. Good for integer values such as page weight, amounts, counters etc. ",
  type: "object",
  properties: {
    ...base,
    type: {
      const: "number",
    },
    default: {
      type: "number",
      multipleOf: { $data: "1/config/step" },
      minimum: { $data: "1/config/min" },
      maximum: { $data: "1/config/max" },
    },
    config: {
      type: "object",
      properties: {
        required: {
          type: "boolean",
        },
        min: {
          type: "number",
          multipleOf: { $data: "1/step" },
          maximum: { $data: "1/max" },
        },
        max: {
          type: "number",
          multipleOf: { $data: "1/step" },
          minimum: { $data: "1/min" },
        },
        step: {
          type: "number",
          exclusiveMinimum: 0,
        },
      },
      additionalProperties: false,
    },
  },
  required: baseRequired,
  additionalProperties: false,
};
