import path from "path";
import { builder } from "../builder/service";
import { cacheInit } from "../cache";
import { FileSystemManager } from "../datasources/filesystem-manager";
import { gql, assertSchema } from "../fields/test-util";

describe("Schema builder", () => {
  test("does it", async () => {
    const projectRoot = path.join(process.cwd(), "src/fixtures/project1");

    const datasource = new FileSystemManager(projectRoot);
    const cache = cacheInit(datasource);
    const schema = await builder.schemaBuilder({ cache });

    assertSchema(schema).matches(gql`
      type Query {
        document(path: String): DocumentUnion
      }

      union DocumentUnion = Post | Author

      type Post {
        path: String
        form: PostForm
        data: PostData
        initialValues: PostInitialValues
      }

      type PostForm {
        label: String
        _template: String
        fields: [PostFormFields]
      }

      union PostFormFields =
          TextareaField
        | SelectField
        | PostSectionsBlocksField

      type TextareaField {
        name: String
        label: String
        component: String
        description: String
      }

      type SelectField {
        name: String
        label: String
        component: String
        options: [String]
      }

      type PostSectionsBlocksField {
        name: String
        label: String
        component: String
        templates: PostSectionsBlocksFieldTemplates
      }

      type PostSectionsBlocksFieldTemplates {
        Section: SectionForm
      }

      type SectionForm {
        label: String
        _template: String
        fields: [SectionFormFields]
      }

      union SectionFormFields = TextareaField | SectionCtaGroupField | ListField

      type SectionCtaGroupField {
        name: String
        label: String
        component: String
        fields: [SectionCtaFormFields]
      }

      union SectionCtaFormFields = TextareaField

      type ListField {
        name: String
        label: String
        component: String
        field: ListFormFieldItemField
      }

      union ListFormFieldItemField = SelectField | TextField

      type TextField {
        component: String
      }

      type PostData {
        title: String
        author: AuthorDocument
        sections: [sectionDataUnion]
      }

      type AuthorDocument {
        document: authorsDocumentUnion
      }

      union authorsDocumentUnion = Author

      type Author {
        path: String
        form: AuthorForm
        data: AuthorData
        initialValues: AuthorInitialValues
      }

      type AuthorForm {
        label: String
        _template: String
        fields: [AuthorFormFields]
      }

      union AuthorFormFields =
          TextareaField
        | SelectField
        | ListField
        | AuthorAccoladesGroupListField

      type AuthorAccoladesGroupListField {
        name: String
        label: String
        component: String
        fields: [AuthorAccoladesFormFields]
      }

      union AuthorAccoladesFormFields = TextareaField

      type AuthorData {
        name: String
        role: String
        anecdotes: [String]
        accolades: [AccoladesData]
      }

      type AccoladesData {
        figure: String
        description: String
      }

      type AuthorInitialValues {
        _template: String
        name: String
        role: String
        anecdotes: [String]
        accolades: [AccoladesData]
      }

      union sectionDataUnion = SectionData

      type SectionData {
        description: String
        cta: CtaData
        authors: AuthorsDocuments
      }

      type CtaData {
        header: String
      }

      type AuthorsDocuments {
        documents: [authorsDocumentUnion]
      }

      type PostInitialValues {
        _template: String
        title: String
        author: String
        sections: [sectionInitialValuesUnion]
      }

      union sectionInitialValuesUnion = SectionInitialValues

      type SectionInitialValues {
        _template: String
        description: String
        authors: [String]
        cta: CtaInitialValues
      }

      type CtaInitialValues {
        _template: String
        header: String
      }

      type Mutation {
        updateDocument(path: String!, params: DocumentInput): DocumentUnion
      }

      input DocumentInput {
        PostInput: PostInput
        AuthorInput: AuthorInput
      }

      input PostInput {
        content: String
        data: PostInputData
      }

      input PostInputData {
        _template: String
        title: String
        author: String
        sections: [PostSectionsBlocksInput]
      }

      input PostSectionsBlocksInput {
        SectionInputData: SectionInputData
      }

      input SectionInputData {
        _template: String
        description: String
        authors: [String]
        cta: CtaInputData
      }

      input CtaInputData {
        _template: String
        header: String
      }

      input AuthorInput {
        content: String
        data: AuthorInputData
      }

      input AuthorInputData {
        _template: String
        name: String
        role: String
        anecdotes: [String]
        accolades: [AccoladesInputData]
      }

      input AccoladesInputData {
        _template: String
        figure: String
        description: String
      }
    `);
  });
});
