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

import React from 'react'
export * from './client'
export * from './auth'
export * from './hooks/use-graphql-forms'
export { useGraphqlForms as unstable_useGraphQLForms } from './hooks/unstable-use-graphql-forms'
export * from './utils'
import { useEditState } from './utils'
import { EditProvider } from './utils'
import { TinaCloudProvider } from './auth'
import { useGraphqlForms } from './hooks/use-graphql-forms'

/**
 * A passthru function which allows editors
 * to know the temlpate string is a GraphQL
 * query or muation
 */
function graphql(strings: TemplateStringsArray) {
  return strings[0]
}
export { graphql }

// InnerApp that handles rendering edit mode or not
function InnerApp({ Component, pageProps }) {
  const { edit } = useEditState()
  if (edit) {
    // Dynamically load Tina only when in edit mode so it does not affect production
    // see https://nextjs.org/docs/advanced-features/dynamic-import#basic-usage
    return (
      <>
        <TinaWrapper {...pageProps}>
          {(props) => <Component {...props} />}
        </TinaWrapper>
        <EditToggle isInEditMode={true} />
      </>
    )
  }
  return (
    <>
      <Component {...pageProps} />
      <EditToggle isInEditMode={true} />
    </>
  )
}

const EditToggle = (isInEditMode) => {
  const { edit, setEdit } = useEditState()
  return (
    <>
      {(Number(process.env.NEXT_PUBLIC_SHOW_EDIT_BTN) || edit) && (
        <>
          <button
            onClick={() => {
              setEdit(!edit)
            }}
            className="editLink"
          >
            {edit ? 'Exit edit mode' : 'Enter edit mode'}
          </button>
        </>
      )}
    </>
  )
}

const Tina = ({ children, ...props }) => {
  return (
    <TinaCloudProvider
      clientId={process.env.NEXT_PUBLIC_TINA_CLIENT_ID}
      branch="main"
      isLocalClient={Boolean(Number(process.env.NEXT_PUBLIC_USE_LOCAL_CLIENT))}
      organization={process.env.NEXT_PUBLIC_ORGANIZATION_NAME}
      // mediaStore={TinaCloudCloudinaryMediaStore}
    >
      <SetupHooks {...props}>{children}</SetupHooks>
    </TinaCloudProvider>
  )
}

const SetupHooks = (props) => {
  const [payload, isLoading] = useGraphqlForms({
    query: (gql) => gql(props.query),
    variables: props.variables || {},
  })
  return (
    <>
      {isLoading ? (
        <div>Loading...{props.children(props)}</div>
      ) : (
        // pass the new edit state data to the child
        props.children({ ...props, data: payload })
      )}
    </>
  )
}

export default Tina

export const TinaEditProvider = (props) => {
  return (
    <EditProvider>
      <TinaEditProviderInner {...props} />
    </EditProvider>
  )
}

const TinaEditProviderInner = ({ children, editMode }) => {
  const { edit } = useEditState()
  if (edit) {
    return editMode
  }

  return children
}

/**
 * This gets loaded dynamically in "pages/_app.js"
 * if you're on a route that starts with "/admin"
 */
const TinaWrapper = (props) => {
  return (
    <TinaCloudProvider
      clientId={process.env.NEXT_PUBLIC_TINA_CLIENT_ID}
      branch="main"
      isLocalClient={Boolean(Number(process.env.NEXT_PUBLIC_USE_LOCAL_CLIENT))}
      organization={process.env.NEXT_PUBLIC_ORGANIZATION_NAME}
      // mediaStore={TinaCloudCloudinaryMediaStore}
    >
      <Inner {...props} />
    </TinaCloudProvider>
  )
}

const Inner = (props) => {
  const [payload, isLoading] = useGraphqlForms({
    query: (gql) => gql(props.query),
    variables: props.variables || {},
  })
  return (
    <>
      {isLoading ? (
        <div>Loading...{props.children(props)}</div>
      ) : (
        // pass the new edit state data to the child
        props.children({ ...props, data: payload })
      )}
    </>
  )
}
