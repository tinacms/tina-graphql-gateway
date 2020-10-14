import type { Settings, Template, TemplateData, WithFields } from "../types";
import _, { create } from "lodash";

import type { DataSource } from "./datasource";
import type { Field } from "../fields";
import { FieldGroupField } from "../fields/field-group";
import { FieldGroupListField } from "../fields/field-group-list";
import { Octokit } from "@octokit/rest";
import { byTypeWorks } from "../types";
import { createAppAuth } from "@octokit/auth-app";
import matter from "gray-matter";
import p from "path";

// We'll need to figure out Auth
const GH_CLIENT = "Iv1.ee9ca7853541fc37";
const GH_SECRET = "708303e8d911e40babcf24909d7432a2e429f883";

const pk = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCXgt/VfmfvI6cf
C8FdeSmaeTRScSTpHyS5Cq/u21hpdvTDIgDPDBpoXPG6Kyfgj0mBwfRlm/QaT1Na
Zmg60sjNLcVnFVj1HTQBySACsPCFPcHXEwcMgz3V2X6KuBq8spzwmox//wKukGGl
QvpiZkNeFpoFfNyiqtdzf/NXWZNLkHLX7GGRZAnQaHvY9l4M9TdmAiD4m44v31XG
gcW2z6Vv76jLcB1mEWYduJXS4F/6IT6Q+zr+jEj5rmv1rAr3VbBTuGYNDeDpek65
lmZHKcITYTh9zNrlmAAzXoLSrp7U7/Ot9s+xc7utFJQTmFYhn4IlLdosBdTkgv2U
QcWZc7T3AgMBAAECggEBAIeVvuk3LZt7tFq8ElarzudF/+SnC/jyvdI6FicSc5Qt
t+vHyiF/G0K5qjiH1i/HCmjsQOGNJm1E/7quWigJ6Vhz1WviVrFDaP8QFW1TGmqi
UY0+odg4umVdNTi+eG7VCEzogUMp2iSNYFScE6VrDm5sm3i9vFR1vkjF/+XzazT6
trZKLQtX0H/R4z3lylLyflW6ujq5yPwIpbk+GZ4uR4JNArXc4lOZ/vC2RThQ83fN
w+sUokUUc9J/Thkq9/3gEBHAbbH8FwDpjhFEvtHaZu6EyW+EpNrdSkRmFbUjLt7s
UkjIKicG9oz4+SrO78lSRi3wzcOUQjw9bwKJ9leJQYECgYEAyYK0Kj1OCJbzf+Ut
MFdZwx9K2njowGEhr4+NwZUFUqTxNvPOcYzI3aUhzhzoBBPX5bEdMC7gHMn/dzXV
iKGZxT8/smQpcd3b63/3v7QeptRb3+Mra4JO020VDlw2JboACAvqE+oVhA0DTM1D
GdrJKLZipKm+RfR/gBCYGRSLzK8CgYEAwHsIx6obrhS+07mjo2wURcL1FZY0V3j4
PNonTSqXNddw0keEgxhCsLjjpgTc5SrmOjX6aLRECWAapbkPCjSqFUFyUFYNxmTW
Xn+fWURl02Bae1SxnnZguUBL7NGS0gC7rK89J6+MLs7lxqWqJmpgh+AvImxgL8cf
ny1wyPj7fjkCgYEAnIYUIANCi9WFCsEfWr9fD/tMj2r/j/9ixRXCzK1OVyWb4E18
/CKZG+Fa4tj9N72aI+Zxf63Jk1MsRpLgbKLp6Jb6iTzYHIRygPkDnjrw3DFzs/Kn
FXlAdWXzxxXFUYSq5ZUrm5Bmag4ZlByUlI6nViJlePYIwBnst7MsEb8t4C0CgYEA
gxhJFpRJXftLLTEWvstx00HBYv52j80YZXm/otMLQeSGNvH20sLHSU3j3sMZIAxj
2enBr2Z3oFsQSycLk0vjO67jiMvTffhX+Oy7PzVSlPDfL3izsNW3cvTTwWvLr7RI
HokMAeeSdp776JwUky2IqYKLF8rwiBn685Mjaf4KbCECgYBZsctEUNDZEUrc6R3t
fj5XvY0VHCTjcSa10wMqR5ffakgKyvQqFRWqOS8UdYjYzaufOlvwJObEsTfRArD6
v0+lPp4QVEM+lhmIZrCkIFzxnolbCUEICtGpkCjbrQtoDni4CgJSetSGSe1NH4I8
Tduo3FzwdlmciYswDLA52g0Hug==
-----END PRIVATE KEY-----
`;



const appOctokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    id: 83861,
    privateKey: pk,
    installationId: "12264194",
    clientId: GH_CLIENT,
    clientSecret: GH_SECRET,
  },
});

export type DocumentArgs = {
  path: string;
};

export class GithubManager implements DataSource {
  rootPath: string;
  constructor(rootPath: string) {
    this.rootPath = rootPath;

    // Pretty bad behavior from gray-matter, without clearing this we'd run the risk
    // of returning cached objects from different projects. This is undocumented behavior
    // but there's an issue for it here https://github.com/jonschlinkert/gray-matter/issues/106
    // There's another library which might be better if we run into trouble with this
    // https://github.com/jxson/front-matter
    // @ts-ignore
    matter.clearCache();
  }

  async getFileContents<T>(filePath: string) {
    const fileContent = await appOctokit.repos.getContent({
      owner: "mittonface",
      repo: "tina-teams-demo-site",
      path: filePath,
    });

    return await parseMatter<T>(
      Buffer.from(fileContent.data.content, "base64")
    );
  }

  async getDirContents<T>(dirPath: string) {
    const dirContents = await appOctokit.repos.getContent({
      owner: "mittonface",
      repo: "tina-teams-demo-site",
      path: dirPath,
    })
    if (Array.isArray(dirContents.data)){
      return dirContents.data.map(t => t.name)
    }

    // TODO: An error I suppose
    return []
  }

  async writeToFile(path: string, content: string){
    // check if the file exists
    const fileContent = await appOctokit.repos.getContent({
      owner: "mittonface",
      repo: "tina-teams-demo-site",
      path: path,
    });

    const fileSha = fileContent.data.sha;

    const response = await appOctokit.repos.createOrUpdateFileContents({
      owner: "mittonface",
      repo: "tina-teams-demo-site",
      path: path,
      message: "Update from GraphQL client",
      content: new Buffer(content).toString('base64'),
      sha: fileSha
    })

    return response
  }

  getDocumentsForSection = async (section?: string) => {
    const templates = await this.getTemplatesForSection(section);
    const pages = templates.map((template) => template.pages || []);
    return _.flatten(pages);
  };

  getTemplates = async (templates: string[]) =>
    await Promise.all(
      templates.map(
        async (template) => await this.getTemplate({ slug: template })
      )
    );

  getTemplatesForSection = async (section?: string) => {
    const { data } = await this.getFileContents<Settings>(".tina/settings.yml");

    const templates = section
      ? data.sections
          .filter(byTypeWorks("directory"))
          .find((templateSection) => {
            const sectionSlug = _.lowerCase(_.kebabCase(templateSection.label));
            return sectionSlug === section;
          })?.templates
      : _.flatten(
          data.sections
            .filter(byTypeWorks("directory"))
            .map(({ templates }) => templates)
        );

    if (!templates) {
      throw new Error(`No templates found for section`);
    }

    return Promise.all(
      templates.map(async (templateBasename) => {
        const { data } = await this.getFileContents<Template>(
          p.join(".tina/front_matter/templates", `${templateBasename}.yml`)
        );
        return namespaceFields(data);
      })
    );
  };
  getData = async ({ path }: DocumentArgs) => {
    const { content, data } = await this.getFileContents<
      matter.GrayMatterFile<string>
    >(path);
    return {
      content,
      data,
    };
  };
  getTemplateForDocument = async (args: DocumentArgs) => {
    const templates = await this.getDirContents(".tina/front_matter/templates")
    const template = (
      await Promise.all(
        templates.map(async (template) => {
          const { data } = await this.getFileContents<Template>(
            p.join(".tina/front_matter/templates", template)
          );

          if (data.pages?.includes(args.path)) {
            return data;
          } else {
            return false;
          }
        })
      )
    ).filter(Boolean)[0];

    if (!template) {
      throw new Error(`Unable to find template for document ${args.path}`);
    }

    return namespaceFields(template);
  };
  getTemplate = async ({ slug }: { slug: string }) => {
    const templates = await this.getDirContents(".tina/front_matter/templates")
    const template = templates.find((templateBasename) => {
      return templateBasename === `${slug}.yml`;
    });
    if (!template) {
      throw new Error(`No template found for slug ${slug}`);
    }
    const { data } = await this.getFileContents<Template>(
      p.join(".tina/front_matter/templates", template)
    );

    return namespaceFields(data);
  };
  updateDocument = async ({
    path,
    params,
  }: {
    path: string;
    params: { content?: string; data: object };
  }) => {
    const fullPath = p.join(this.rootPath, path);
    const string = matter.stringify("", params.data);

    await this.writeToFile(path, string)
  };
}

export const FMT_BASE = ".forestry/front_matter/templates";
export const parseMatter = async <T>(data: Buffer): Promise<T> => {
  let res;
  res = matter(data, { excerpt_separator: "<!-- excerpt -->" });

  // @ts-ignore
  return res;
};

function isWithFields(t: TemplateData | Field): t is WithFields {
  return t.hasOwnProperty("fields");
}

const namespaceFields = (template: TemplateData): TemplateData => {
  return {
    ...template,
    fields: template.fields.map((f) => {
      if (isWithFields(f)) {
        return {
          ...namespaceSubFields(f, template.label),
        };
      } else {
        return {
          ...f,
          __namespace: `${template.label}`,
        };
      }
    }),
  };
};
const namespaceSubFields = (
  template: FieldGroupField | FieldGroupListField,
  parentNamespace: string
): Field => {
  return {
    ...template,
    fields: template.fields.map((f) => {
      if (isWithFields(f)) {
        return {
          ...namespaceSubFields(f, template.label),
          __namespace: `${parentNamespace}${template.label}`,
        };
      } else {
        return {
          ...f,
        };
      }
    }),
    __namespace: parentNamespace,
  };
};
