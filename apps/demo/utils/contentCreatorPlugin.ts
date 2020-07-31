import { AddContentPlugin, Field, CMS } from "tinacms";

interface CreateContentButtonOptions<FormShape, FrontmatterShape> {
  label: string;
  fields: AnyField[];
  filename(form: FormShape): MaybePromise<string>;
  frontmatter?(form: FormShape): MaybePromise<FrontmatterShape>;
  body?(form: FormShape): MaybePromise<string>;
}

type MaybePromise<T> = Promise<T> | T;

interface AnyField extends Field {
  [key: string]: any;
}

const MISSING_FILENAME_MESSAGE = "No filename supplied";
const MISSING_FIELDS_MESSAGE = "No fields supplied";

export class ContentCreatorPlugin<FormShape = any, FrontmatterShape = any>
  implements AddContentPlugin<FormShape> {
  __type: "content-creator" = "content-creator";
  fields: AddContentPlugin<FormShape>["fields"];

  name: string;

  // Implementation Specific
  filename: (form: FormShape) => MaybePromise<string>;
  frontmatter: (form: FormShape) => MaybePromise<FrontmatterShape>;
  body: (form: any) => MaybePromise<string>;

  constructor(
    options: CreateContentButtonOptions<FormShape, FrontmatterShape>
  ) {
    if (!options.filename) {
      console.error("No filename supplied");
      throw new Error(MISSING_FILENAME_MESSAGE);
    }

    if (!options.fields || options.fields.length === 0) {
      console.error(MISSING_FIELDS_MESSAGE);
      throw new Error(MISSING_FIELDS_MESSAGE);
    }

    this.fields = options.fields;
    this.filename = options.filename;
    this.frontmatter = options.frontmatter || (() => ({} as FrontmatterShape));
    this.body = options.body || (() => "");
    this.name = options.label;
  }

  async onSubmit(form: FormShape, cms: CMS) {
    const fileRelativePath = await this.filename(form);

    await cms.api.forestry.addContent({
      path: fileRelativePath,
      template: "block-page",
      payload: {
        title: this.name,
        blocks: [],
      },
    });

    window.location.href = fileRelativePath.split("pages/")[1].split(".")[0];
  }
}
