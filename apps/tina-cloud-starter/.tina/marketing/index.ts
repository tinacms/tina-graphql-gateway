import { TinaCloudCollection } from "tina-graphql-gateway-cli";
import { templates } from "./templates";

export const Marketing: TinaCloudCollection = {
  label: "Marketing Pages",
  name: "marketingPages",
  path: "content/marketing-pages",
  templates: templates,
};
