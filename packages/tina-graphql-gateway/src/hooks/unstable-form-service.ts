/**
Copyright 2021 Forestry.io Holdings, Inc.
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
} from 'xstate'
import { splitQuery } from 'tina-graphql-helpers'
import { Form, TinaCMS } from 'tinacms'

import type { Client } from '../client'
import type { DocumentNode } from './use-graphql-forms'
import { fixMutators } from './temporary-fix-mutators'
import { formifyCallback } from './use-graphql-forms'

export const createFormMachine = (initialContext: {
  queryFieldName: string
  queryString: string
  node: DocumentNode
  client: Client
  cms: TinaCMS
  onSubmit: (args: any) => void
  formify?: formifyCallback
}) => {
  const id = initialContext.queryFieldName + '_FormService'
  return createMachine<NodeFormContext, NodeFormEvent, NodeFormState>({
    id,
    initial: 'loading',
    states: {
      loading: {
        invoke: {
          id: id + 'breakdownData',
          src: async (context, event) => {
            return splitQuery({
              queryString: context.queryString,
              schema: await context.client.getSchema(),
            })
          },
          onDone: {
            target: 'ready',
            actions: assign({
              queries: (context, event) => {
                return event.data.queries
              },
              fragments: (context, event) => {
                return event.data.fragments
              },
            }),
          },
          onError: 'failure',
        },
      },
      ready: {
        entry: assign({
          formRef: (context) => spawn(formCallback(context)),
        }),
        on: {
          ON_FIELD_CHANGE: {
            actions: sendParent((context, event) => ({
              type: 'FORM_VALUE_CHANGE',
              pathAndValue: event.values,
            })),
          },
        },
      },
      failure: {
        entry: (c, e) => console.log('failed', e),
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
      formify: initialContext.formify,
    },
  })
}

export type NodeFormContext = {
  queryFieldName: string
  queryString: string
  node: DocumentNode
  cms: TinaCMS
  client: Client
  formRef: null | SpawnedActorRef<any, any>
  queries: {
    [key: string]: {
      query: string
      mutation: string
      fragments: string[]
    }
  } | null
  fragments: { name: string; fragment: string }[]
  error: null | string
  onSubmit: (args: any) => void
  formify: formifyCallback
}

export type NodeFormEvent = {
  type: 'ON_FIELD_CHANGE'
  values: { path: (string | number)[]; value: unknown }
}

type NodeFormState =
  | {
      value: 'idle'
      context: NodeFormContext
    }
  | {
      value: 'loading'
      context: NodeFormContext & {
        error: null
      }
    }
  | {
      value: 'ready'
      context: NodeFormContext & {
        error: null
      }
    }
  | {
      value: 'failure'
      context: NodeFormContext & {
        error: string
      }
    }

const formCallback = (context: NodeFormContext) => (callback, receive) => {
  const path = [context.queryFieldName, 'data']
  // const fields = buildFields({
  //   parentPath: path,
  //   context,
  //   // @ts-ignore FIXME: Pick< isn't working properly for some reason
  //   form: context.node.form,
  //   callback,
  // })

  const formConfig = {
    id: context.queryFieldName,
    label: context.node._internalSys.basename,
    fields: context.node.form.fields,
    reset: () => {
      // callback({
      //   type: 'ON_FIELD_CHANGE',
      //   values: {
      //     path: [context.queryFieldName, 'data'],
      //     value: context.node.initialData,
      //   },
      // })
    },
    initialValues: context.node.values,
    onSubmit: async (values) => {
      const queryForMutation = context.queries[context.queryFieldName]
      const mutation = queryForMutation.mutation

      const frags = []
      let uniqueFragments = [...new Set(queryForMutation.fragments)]
      uniqueFragments.forEach((fragment) => {
        frags.push(
          context.fragments.find((fr) => fr.name === fragment).fragment
        )
      })

      try {
        await context.onSubmit({
          mutationString: `${frags.join('\n')}
${mutation}
`,
          relativePath: context.node._internalSys.relativePath,
          values: values,
          sys: context.node._internalSys,
        })
        context.cms.alerts.info('Document saved!')
      } catch (e) {
        console.error(e)
        context.cms.alerts.info(e.message)
      }
    },
  }

  const createForm = (formConfig) => {
    const form = new Form(formConfig)
    context.cms.plugins.add(form)
    return form
  }

  let form
  let skipped = false
  const skip = () => {
    skipped = true
  }
  if (context.formify) {
    form = context.formify({ formConfig, createForm, skip })
  } else {
    form = createForm(formConfig)
  }
  // const { change } = form.finalForm
  // console.log(form.finalForm)
  // form.finalForm.change = (name, value) => {
  //   console.log('i changed', name, value)
  //   change(name, value)
  // }

  if (skipped) return

  if (!(form instanceof Form)) {
    throw new Error('formify must return a form or skip()')
  }

  /**
   *
   * HEADS UP this should be removed when
   * https://github.com/tinacms/tinacms/issues/1669 is resolved
   *
   */
  fixMutators({ context, form, callback })

  form.subscribe(
    (all) => {
      // Sync form value changes to value key
      callback({
        type: 'ON_FIELD_CHANGE',
        values: {
          path: [context.queryFieldName],
          value: all.values,
        },
      })
    },
    { values: true }
  )

  return () => context.cms.plugins.remove(form)
}
