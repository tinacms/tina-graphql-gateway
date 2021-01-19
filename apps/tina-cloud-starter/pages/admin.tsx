import React from "react";
import type * as Tina from "../.tina/types";
import { TinaCMS } from "tinacms";
import { TinaCloudAuthWall, useForm } from "tina-graphql-gateway";
import { createCloudClient, variablesFromPath } from "../utils";
import { request, DEFAULT_VARIABLES } from "./[[...slug]]";
import { DocumentRenderer } from "../components/document-renderer";
import { useUrlHash } from "../hooks/use-url-hash";

const client = createCloudClient();

export default function AdminPage() {
  const cms = new TinaCMS({
    apis: {
      tina: client,
    },
    sidebar: true,
    enabled: false,
  });

  return (
    <TinaCloudAuthWall cms={cms}>
      <Editor client={client} />
    </TinaCloudAuthWall>
  );
}

export const Editor = ({ client }: { client }) => {
  let slug = useUrlHash();

  const [data, setData] = React.useState({});

  React.useEffect(() => {
    const run = async () => {
      const response = await request(
        client,
        variablesFromPath(slug, DEFAULT_VARIABLES)
      );

      setData(response);
    };

    run();
  }, [slug]);

  const payload = useForm<{
    getDocument: Tina.SectionDocumentUnion;
  }>({
    payload: data,
    onNewDocument: (args) => {
      const redirect = `${window.location.origin}${window.location.pathname}#${
        args.section.slug
      }/${args.breadcrumbs.join("/")}`;
      console.log(redirect);

      window.location.assign(redirect);
    },
  });

  return payload.getDocument ? (
    <DocumentRenderer {...payload.getDocument} />
  ) : (
    <p>Loading...</p>
  );
};
