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

import { base, baseRequired } from "../common";

export const ImageField = {
  $id: "#imageField",
  label: "Image Field",
  description:
    "A single file input that adds assets to the Media Library. Good for a featured image or a profile picture. ",
  type: "object",
  properties: {
    type: {
      const: "file",
    },
    ...base,
    default: {
      type: gql.TYPES.String,
      minLength: 1,
      removeIfFails: true,
    },
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
        maxSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: baseRequired,
};
