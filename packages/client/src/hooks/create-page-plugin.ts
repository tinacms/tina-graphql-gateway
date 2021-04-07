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

import { AddContentPlugin, Field, TinaCMS } from "tinacms";

interface CreateContentButtonOptions {
  label: string;
  fields: any[];
  onNewDocument: OnNewDocument;
}

type FormShape = { sectionTemplate: string; relativePath: string };

export type OnNewDocument = (args: {
  section: { slug: string };
  relativePath: string;
  breadcrumbs: string[];
  path: string;
}) => void;

export class ContentCreatorPlugin implements AddContentPlugin<FormShape> {
  __type: "content-creator" = "content-creator";
  fields: AddContentPlugin<FormShape>["fields"];
  onNewDocument: OnNewDocument;
  name: string;

  constructor(options: CreateContentButtonOptions) {
    this.fields = options.fields;
    this.name = options.label;
    this.onNewDocument = options.onNewDocument;
  }

  async onSubmit(form: FormShape, cms: TinaCMS) {
    const sectionTemplateArray = form.sectionTemplate
      ? form.sectionTemplate.split(".")
      : this.fields
          .find((field) => field.name === "sectionTemplate")
          // @ts-ignore - FIXME: we need a way to supply an initial value https://github.com/tinacms/tinacms/issues/1715
          .options[0].value.split(".");
    const payload = {
      relativePath: form.relativePath,
      section: sectionTemplateArray[0],
      template: sectionTemplateArray[1],
    };

    try {
      const res = await cms.api.tina.addPendingContent(payload);
      if (res.errors) {
        res.errors.map((e) => {
          cms.alerts.error(e.message);
        });
      } else {
        cms.alerts.info("Document created!");
        this.onNewDocument(res.addPendingDocument.sys);
      }
    } catch (e) {
      cms.alerts.error(e.message);
    }
  }
}
