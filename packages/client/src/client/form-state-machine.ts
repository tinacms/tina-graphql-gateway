import {
  createMachine,
  assign,
  interpret,
  spawn,
  SpawnedActorRef,
} from "xstate";
import { splitDataNode } from "@forestryio/graphql-helpers";
import { Form, TinaCMS } from "tinacms";
import type { ForestryClient } from "../client";
import type { DocumentNode } from "./useForestryForm";

type NodeFormContext = {
  queryFieldName: string;
  queryString: string;
  node: DocumentNode;
  cms: TinaCMS;
  client: ForestryClient;
  formRef: null | SpawnedActorRef<any, any>;
  queries: { [key: string]: string } | null;
  error: null | string;
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
      field.fields = field.fields = buildFields({
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

/**
 *
 * Provides
 *
 */
const buildParseFunction = ({ parentPath, context, field, callback }) => {
  return (value, name) => {
    // Remove indexes in path, ex. "data.0.blocks.2.author" -> "data.blocks.author"
    const queryPath = [...parentPath, ...name.split(".")]
      .filter((item) => {
        return isNaN(parseInt(item));
      })
      .join(".");

    if (field.component === "select" && context.queries[queryPath]) {
      context.client
        .request(context.queries[queryPath], {
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

const formCallback = (context) => (callback, receive) => {
  const path = [context.queryFieldName, "data"];
  const fields = buildFields({
    parentPath: path,
    context,
    callback,
    ...context.node,
  });

  const form = new Form({
    id: context.queryFieldName,
    label: context.node.sys.basename,
    fields,
    initialValues: context.node.values,
    onSubmit: async (values) => {
      console.log("submit it", values);
    },
  });

  context.cms.plugins.add(form);

  return () => context.cms.plugins.remove(form);
};

export const createFormService = (
  initialContext: {
    queryFieldName: string;
    queryString: string;
    node: DocumentNode;
    client: ForestryClient;
    cms: TinaCMS;
  },
  onChange
) => {
  const id = initialContext.queryFieldName + "_NodeFormMachine";
  const formMachine = createMachine<
    NodeFormContext,
    NodeFormEvent,
    NodeFormState
  >(
    {
      id,
      initial: "loading",
      states: {
        loading: {
          invoke: {
            id: id + "breakdownData",
            src: "breakdownData",
            onDone: {
              target: "ready",
              actions: assign({
                queries: (context, event) => {
                  return event.data;
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
              actions: (context, event) => {
                onChange(event.values);
              },
            },
          },
        },
        failure: {},
      },
      context: {
        queryFieldName: initialContext.queryFieldName,
        queryString: initialContext.queryString,
        node: initialContext.node,
        cms: initialContext.cms,
        client: initialContext.client,
        queries: null,
        error: null,
        formRef: null,
      },
    },
    {
      services: {
        breakdownData: async (context, event) => {
          return splitDataNode({
            queryFieldName: context.queryFieldName,
            queryString: context.queryString,
            node: context.node,
            schema: await context.client.getSchema(),
          });
        },
        createForm: async (context, event) => {
          const form = new Form({
            id: context.queryFieldName,
            label: context.node.sys.basename,
            fields: context.node.form.fields,
            initialValues: context.node.values,
            onSubmit: async (values) => {
              console.log("submit it", values);
            },
          });
          context.cms.plugins.add(form);

          // return form.unsubscribe() // Should support this
          return form;
        },
      },
    }
  );

  const service = interpret(formMachine).start();

  return service;
};
