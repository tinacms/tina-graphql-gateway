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

import React, { useMemo } from 'react'
import { useCMS } from 'tinacms'
import type { TinaCMS, FormOptions } from 'tinacms'
import { Form } from 'tinacms'
import set from 'lodash.set'
import merge from 'lodash.merge'
import { wrapFieldsWithMeta, Select } from 'tinacms'
import { createFormMachine } from './unstable-form-service'
import { createMachine, spawn, StateSchema, assign } from 'xstate'
import { useMachine } from '@xstate/react'
import { formsMachine } from './state-machine'
import gql from 'graphql-tag'
import { print } from 'graphql'
import { produce } from 'immer'
import type { DocumentNode as GqlDocumentNode } from 'graphql'
import { getIn } from 'final-form'

export interface FormifyArgs {
  formConfig: FormOptions<any>
  createForm: (formConfig: FormOptions<any>) => Form
  skip?: () => void
}

export type formifyCallback = (args: FormifyArgs) => Form | void

export function useGraphqlForms<T extends object>({
  query,
  variables,
  onSubmit,
  formify = null,
}: {
  query: (gqlTag: typeof gql) => GqlDocumentNode
  variables: object
  onSubmit?: (args: { queryString: string; variables: object }) => void
  formify?: formifyCallback
}): [T, Boolean] {
  const cms = useCMS()
  const [formValues, setFormValues] = React.useState({})
  const [formObject, setFormObject] = React.useState({})
  const [form, setForm] = React.useState({})
  const [data, setData] = React.useState({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [newUpdate, setNewUpdate] =
    React.useState<{
      get: string
      set: string
      lookup?: string
    } | null>(null)

  React.useEffect(() => {
    const run = async () => {
      if (newUpdate) {
        const newValue = getIn(formValues, newUpdate.get)
        if (formObject?.paths) {
          const asyncUpdate = formObject.paths.find(
            (p) => p.dataPath.join('.') === newUpdate.set
          )
          if (asyncUpdate) {
            const nextState = await produce(data, async (draftState) => {
              const res = await cms.api.tina.request(asyncUpdate.queryString, {
                variables: { id: newValue },
              })
              set(draftState, newUpdate.set, res.node)
            })
            setData(nextState)
            setNewUpdate(null)
            return
          }
        }
        const nextState = produce(data, (draftState) => {
          // We're in a polymorphic object, so we're populating __typename
          // as a disambiguator, regardless of whether or not it was queried
          // for. FIXME: This should assume newValue to be an array
          if (newUpdate.lookup) {
            const items = newUpdate.lookup.split('.')
            let currentFields = form.fields
            items.map((item, index) => {
              const lookupName = items.slice(0, index + 1).join('.')
              const value = getIn(
                formValues,
                ['getMarketingPagesDocument', 'values', lookupName].join('.')
              )
              if (isNaN(Number(item))) {
                const field = currentFields.find((field) => field.name === item)
                currentFields = field
              } else {
                const template = currentFields.templates[value._template]
                currentFields = template.fields
              }
            })
            const field = currentFields
            if (field && field.typeMap) {
              newValue.forEach((item) => {
                if (!item.__typename) {
                  item['__typename'] = field.typeMap[item._template]
                }
              })
            }
          }
          set(draftState, newUpdate.set, newValue)
        })
        setData(nextState)
        setNewUpdate(null)
      }
    }
    run()
  }, [JSON.stringify(newUpdate)])

  const queryString = print(query(gql))
  React.useEffect(() => {
    cms.api.tina
      .requestWithForm(query, { variables })
      .then((payload) => {
        Object.entries(payload).map(([queryName, result]) => {
          setFormObject(result.form)
          const form = new Form({
            id: queryName,
            label: queryName,
            initialValues: result.values,
            fields: result.form.fields,
            onSubmit: (...stuff) => {
              console.log(stuff)
            },
          })
          setForm(form)
          setData({ [queryName]: { data: result.data } })
          setIsLoading(false)
          cms.forms.add(form)
          const { change } = form.finalForm
          form.finalForm.change = (name, value) => {
            setNewUpdate({
              get: [queryName, 'values', name].join('.'),
              set: [queryName, 'data', name].join('.'),
            })
            return change(name, value)
          }

          const {
            insert,
            move,
            remove,
            ...rest
            // concat,
            // pop,
            // push,
            // removeBatch,
            // shift,
            // swap,
            // unshift,
            // update,
          } = form.finalForm.mutators
          form.finalForm.mutators = {
            insert: (...args) => {
              const name = args[0]
              setNewUpdate({
                get: [queryName, 'values', name].join('.'),
                set: [queryName, 'data', name].join('.'),
                lookup: name,
              })
              insert(...args)
            },
            move: (...args) => {
              const name = args[0]
              setNewUpdate({
                get: [queryName, 'values', name].join('.'),
                set: [queryName, 'data', name].join('.'),
              })
              move(...args)
            },
            remove: (...args) => {
              const name = args[0]
              setNewUpdate({
                get: [queryName, 'values', name].join('.'),
                set: [queryName, 'data', name].join('.'),
              })
              remove(...args)
            },
            ...rest,
          }
          form.subscribe(
            ({ values }) => {
              setFormValues({ ...formValues, [queryName]: { values: values } })
            },
            { values: true }
          )
        })
      })
      .catch((e) => {
        console.error(e)
      })
  }, [queryString])

  // @ts-ignore
  return [data, isLoading]
}
