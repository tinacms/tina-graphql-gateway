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
import { splitDataNode } from "@forestryio/graphql-helpers";
import { Form, TinaCMS } from "tinacms";
import finalFormArrays from "final-form-arrays";
import { getIn, setIn } from "final-form";

import type { Client } from "../client";
import type { DocumentNode } from "./use-form";

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
            return splitDataNode({
              queryString: context.queryString,
              node: context.node,
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

type NodeFormContext = {
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

type NodeFormEvent = {
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
    label: context.node.sys.basename,
    fields,
    initialValues: context.node.values,
    onSubmit: async (values) => {
      const queryForMutation = context.queries[context.queryFieldName];
      const mutation = queryForMutation.mutation;

      const frags = [];
      queryForMutation.fragments.forEach((fragment) => {
        frags.push(
          context.fragments.find((fr) => fr.name === fragment).fragment
        );
      });

      try {
        await context.onSubmit({
          mutationString: `${frags.join("\n")}
${mutation}
`,
          relativePath: context.node.sys.relativePath,
          values: values,
          sys: context.node.sys,
        });
        context.cms.alerts.info("Document saved!");
      } catch (e) {
        context.cms.alerts.info(e.message);
      }
    },
  });

  /**
   *
   * The following changes to final-form mutators are not intended to
   * be a long-term solution. The goal of these changes is to enable
   * the ability to "subscribe" to field-level changes for array mutations.
   *
   * An example of this is that we don't get any sort of event from Tina
   * when a new block or list item is added, rearranged, or removed. This
   * makes it impossible for us to keep the `data` of our GraphQL response
   * in-sync with form state.
   *
   * A long-term solution for this should be discussed in this ticket
   * https://github.com/tinacms/tinacms/issues/1669
   *
   */
  const changeValue = (state, name, mutate) => {
    const before = getIn(state.formState.values, name);
    const after = mutate(before);
    state.formState.values = setIn(state.formState.values, name, after) || {};
  };

  const { move: moveCopy, remove: removeCopy, insert: insertCopy } = {
    ...form.finalForm.mutators,
  };
  form.finalForm.mutators.move = (name, from, to) => {
    const dataValue = getIn(context.node.data, name);
    let state = {
      formState: { values: { fakeValue: dataValue } },
    };
    try {
      // @ts-ignore state is expecting the full final-form state, but we don't need it
      finalFormArrays.move(["fakeValue", from, to], state, { changeValue });
      // FIXME: this throws an error, probably because of "state" but the mutation works :shrug:
    } catch (e) {
      callback({
        type: "ON_FIELD_CHANGE",
        values: {
          path: [context.queryFieldName, "data", ...name.split(".")],
          value: state.formState.values.fakeValue,
        },
      });
    }

    // Return the copy like nothing ever happened
    return moveCopy(name, from, to);
  };

  form.finalForm.mutators.remove = (name, index) => {
    const dataValue = getIn(context.node.data, name);
    let state = {
      formState: { values: { fakeValue: dataValue } },
    };
    try {
      // @ts-ignore state is expecting the full final-form state, but we don't need it
      finalFormArrays.remove(["fakeValue", index], state, { changeValue });
      // FIXME: this throws an error, probably because of "state" but the mutation works :shrug:
    } catch (e) {
      callback({
        type: "ON_FIELD_CHANGE",
        values: {
          path: [context.queryFieldName, "data", ...name.split(".")],
          value: state.formState.values.fakeValue,
        },
      });
    }

    // Return the copy like nothing ever happened
    return removeCopy(name, index);
  };

  form.finalForm.mutators.insert = (name, index, item) => {
    const dataValue = getIn(context.node.data, name);
    let state = {
      formState: { values: { fakeValue: dataValue } },
    };
    try {
      let newItem = item;
      // FIXME: this is a pretty rough translation, not sure if "_Data" would be present in all cases
      // This should be abstracted in to graphql-helpers so we can commonize these transforms
      if (item._template) {
        newItem = {
          __typename:
            item._template.charAt(0).toUpperCase() +
            item._template.slice(1) +
            "_Data",
        };
      } else {
        // if item is -> {}, the real insertCopy doesn't set up the event listeners properly
        // so inputs within the added field won't work for some reason
        if (
          item &&
          Object.keys(item).length === 0 &&
          item.constructor === Object
        ) {
          item = null;
        }
      }
      finalFormArrays.insert(
        ["fakeValue", index, newItem],
        // @ts-ignore state is expecting the full final-form state, but we don't need it
        state,
        {
          changeValue,
        }
      );
      // FIXME: this throws an error, probably because of "state" but the mutation works :shrug:
    } catch (e) {
      callback({
        type: "ON_FIELD_CHANGE",
        values: {
          path: [context.queryFieldName, "data", ...name.split(".")],
          value: state.formState.values.fakeValue,
        },
      });
    }

    // Return the copy like nothing ever happened
    return insertCopy(name, index, item);
  };

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
