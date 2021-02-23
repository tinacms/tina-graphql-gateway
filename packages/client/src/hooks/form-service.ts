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

import {
  createMachine,
  assign,
  spawn,
  SpawnedActorRef,
  sendParent,
} from "xstate";
import { splitQuery } from "@forestryio/graphql-helpers";
import { Form, TinaCMS } from "tinacms";
import { print } from "graphql";

import type { Client } from "../client";
import type { DocumentNode } from "./use-form";
import { fixMutators } from "./temporary-fix-mutators";

export const createFormMachine = (initialContext: {
  queryFieldName: string;
  queryString: string;
  node: DocumentNode;
  client: Client;
  cms: TinaCMS;
  onSubmit: (args: any) => void;
}) => {
  const id = initialContext.queryFieldName + "_FormService";
  return createMachine<NodeFormContext, NodeFormEvent, NodeFormState>({
    id,
    initial: "loading",
    states: {
      loading: {
        invoke: {
          id: id + "breakdownData",
          src: async (context, event) => {
            return splitQuery({
              queryString: context.queryString,
              schema: await context.client.getSchema(),
            });
          },
          onDone: {
            target: "ready",
            actions: assign({
              queries: (context, event) => {
                return event.data.queries;
              },
              fragments: (context, event) => {
                return event.data.fragments;
              },
            }),
          },
          onError: "failure",
        },
      },
      ready: {
        entry: assign({
          formRef: (context) => spawn(formCallback(context)),
        }),
        on: {
          ON_FIELD_CHANGE: {
            actions: sendParent((context, event) => ({
              type: "FORM_VALUE_CHANGE",
              pathAndValue: event.values,
            })),
          },
        },
      },
      failure: {
        entry: (c, e) => console.log("failed", e),
      },
    },
    context: {
      queryFieldName: initialContext.queryFieldName,
      queryString: initialContext.queryString,
      node: initialContext.node,
      cms: initialContext.cms,
      client: initialContext.client,
      queries: null,
      fragments: null,
      error: null,
      formRef: null,
      onSubmit: initialContext.onSubmit,
    },
  });
};

export type NodeFormContext = {
  queryFieldName: string;
  queryString: string;
  node: DocumentNode;
  cms: TinaCMS;
  client: Client;
  formRef: null | SpawnedActorRef<any, any>;
  queries: {
    [key: string]: {
      query: string;
      mutation: string;
      fragments: string[];
    };
  } | null;
  fragments: { name: string; fragment: string }[];
  error: null | string;
  onSubmit: (args: any) => void;
};

export type NodeFormEvent = {
  type: "ON_FIELD_CHANGE";
  values: { path: (string | number)[]; value: unknown };
};

type NodeFormState =
  | {
      value: "idle";
      context: NodeFormContext;
    }
  | {
      value: "loading";
      context: NodeFormContext & {
        error: null;
      };
    }
  | {
      value: "ready";
      context: NodeFormContext & {
        error: null;
      };
    }
  | {
      value: "failure";
      context: NodeFormContext & {
        error: string;
      };
    };

const buildFields = ({
  parentPath,
  form,
  context,
  callback,
}: {
  parentPath: string[];
  form: Pick<DocumentNode, "form">;
  context: NodeFormContext;
  callback: (args: NodeFormEvent) => void;
}) => {
  // @ts-ignore FIXME: gotta do a type assertion here
  return form.fields.map((field) => {
    // Group List and Group
    if (field.component === "group" || field.component === "group-list") {
      field.fields = buildFields({
        parentPath: parentPath,
        form: field,
        context,
        callback,
      });
    }

    // List
    if (field.component === "list") {
      field.field = {
        ...field.field,
        parse: buildParseFunction({
          parentPath,
          callback,
          context,
          field: field.field,
        }),
      };
    }

    // Blocks
    if (field.component === "blocks") {
      const templateKeys = Object.keys(field.templates);
      Object.values(field.templates).map((template, index) => {
        field.templates[templateKeys[index]].fields = buildFields({
          parentPath,
          context,
          // @ts-ignore FIXME: gotta do a type assertion here
          form: template,
          callback,
        });
      });
    }

    return {
      ...field,
      parse: buildParseFunction({ parentPath, context, field, callback }),
    };
  });
};

const buildParseFunction = ({
  parentPath,
  context,
  field,
  callback,
}: {
  parentPath;
  context: NodeFormContext;
  field;
  callback;
}) => {
  return (value, name) => {
    // Remove indexes in path, ex. "data.0.blocks.2.author" -> "data.blocks.author"
    const queryPath = [...parentPath, ...name.split(".")]
      .filter((item) => {
        return isNaN(parseInt(item));
      })
      .join(".");

    if (field.component === "select" && context.queries[queryPath]) {
      context.client
        .request(context.queries[queryPath].query, {
          variables: {
            relativePath: value,
          },
        })
        .then((res) => {
          callback({
            type: "ON_FIELD_CHANGE",
            values: {
              path: [...parentPath, ...name.split(".")],
              value: Object.values(res)[0],
            },
          });
        });
    } else {
      callback({
        type: "ON_FIELD_CHANGE",
        values: {
          path: [...parentPath, ...name.split(".")],
          value,
        },
      });
    }
    return value;
  };
};

const formCallback = (context: NodeFormContext) => (callback, receive) => {
  const path = [context.queryFieldName, "data"];
  const fields = buildFields({
    parentPath: path,
    context,
    // @ts-ignore FIXME: Pick< isn't working properly for some reason
    form: context.node.form,
    callback,
  });

  const form = new Form({
    id: context.queryFieldName,
    label: context.node._internalSys.basename,
    fields,
    initialValues: context.node.values,
    onSubmit: async (values) => {
      const queryForMutation = context.queries[context.queryFieldName];
      const mutation = queryForMutation.mutation;

      const frags = [];
      let uniqueFragments = [...new Set(queryForMutation.fragments)];
      uniqueFragments.forEach((fragment) => {
        frags.push(
          context.fragments.find((fr) => fr.name === fragment).fragment
        );
      });
      console.log(uniqueFragments);

      try {
        await context.onSubmit({
          mutationString: `${frags.join("\n")}
${mutation}
`,
          relativePath: context.node._internalSys.relativePath,
          values: values,
          sys: context.node._internalSys,
        });
        context.cms.alerts.info("Document saved!");
      } catch (e) {
        context.cms.alerts.info(e.message);
      }
    },
  });

  /**
   *
   * HEADS UP this should be removed when
   * https://github.com/tinacms/tinacms/issues/1669 is resolved
   *
   */
  fixMutators({ context, form, callback });

  form.subscribe(
    (all) => {
      // Sync form value changes to value key
      callback({
        type: "ON_FIELD_CHANGE",
        values: {
          path: [context.queryFieldName, "values"],
          value: all.values,
        },
      });
    },
    { values: true }
  );

  context.cms.plugins.add(form);

  return () => context.cms.plugins.remove(form);
};
