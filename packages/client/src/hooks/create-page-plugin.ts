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
