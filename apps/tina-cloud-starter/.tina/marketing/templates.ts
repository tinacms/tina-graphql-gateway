import { TinaCloudTemplate } from "tina-graphql-gateway-cli";
import { landingPageFields } from "./landingPageFields";

export const templates: TinaCloudTemplate[] = [
  {
    label: "Landing Page",
    name: "landingPage",
    fields: landingPageFields,
  },
];
