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

const Tina = ({
  children,
  config,
  ...props
}: {
  children: React.ReactNode
  config: Parameters<typeof TinaCloudProvider>
}) => {
  return (
    <TinaCloudProvider {...config}>
      <SetupHooks {...props}>{children}</SetupHooks>
    </TinaCloudProvider>
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
