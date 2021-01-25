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

import { AddContentPlugin, Field, TinaCMS } from "tinacms";

interface CreateContentButtonOptions<FormShape> {
  label: string;
  fields: any[];
  section: string;
}

export class ContentCreatorPlugin<
  FormShape = { filename: string; template: string }
> implements AddContentPlugin<FormShape> {
  __type: "content-creator" = "content-creator";
  fields: AddContentPlugin<FormShape>["fields"];
  section: string;

  name: string;

  constructor(options: CreateContentButtonOptions<FormShape>) {
    this.fields = options.fields;
    this.section = options.section;
    this.name = options.label;
  }

  async onSubmit(form: FormShape, cms: TinaCMS) {
    const payload = {
      // @ts-ignore
      relativePath: form.filename,
      section: this.section,
      // @ts-ignore
      template: form.template,
    };
    const res = await cms.api.tina.addPendingContent(payload);

    const redirectURL = `/${
      this.section
    }/${res.addPendingDocument.breadcrumbs.join("/")}`;

    window.location.href = redirectURL;
  }
}
