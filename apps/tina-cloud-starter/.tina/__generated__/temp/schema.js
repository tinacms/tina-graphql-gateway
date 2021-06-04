"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var tina_graphql_gateway_cli_1 = require("tina-graphql-gateway-cli");
var authorCollection_1 = require("./authorCollection");
var blogPostCollection_1 = require("./blog/blogPostCollection");
var marketing_1 = require("./marketing");
exports.default = tina_graphql_gateway_cli_1.defineSchema({
    collections: [authorCollection_1.AuthorCollection, blogPostCollection_1.BlogPostCollection, marketing_1.Marketing],
});
