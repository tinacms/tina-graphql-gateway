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
    const sectionTemplateArray = form.sectionTemplate.split(".");
    const payload = {
      relativePath: form.relativePath,
      section: sectionTemplateArray[0],
      template: sectionTemplateArray[1],
    };

    try {
      const res = await cms.api.tina.addPendingContent(payload);
      cms.alerts.info("Document created!");

      this.onNewDocument(res.addPendingDocument.sys);
    } catch (e) {
      cms.alerts.error(e.message);
    }
  }
}
