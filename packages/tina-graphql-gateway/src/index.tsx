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
import { useGraphqlForms as unstable_useGraphQLForms } from './hooks/unstable-use-graphql-forms'
export * from './client'
export * from './auth'
export * from './hooks/use-graphql-forms'
export { useGraphqlForms as unstable_useGraphQLForms } from './hooks/unstable-use-graphql-forms'
export * from './utils'
import { TinaCloudProvider } from './auth'

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
  const [payload, isLoading] = unstable_useGraphQLForms({
    query: (gql) => gql(props.query),
    variables: props.variables || {},
  })
  return (
    <ErrorBoundary>
      {isLoading ? (
        <div>Loading...{props.children(props)}</div>
      ) : (
        // pass the new edit state data to the child
        props.children({ ...props, data: payload })
      )}
    </ErrorBoundary>
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
      {
        // @ts-ignore
        props.query ? (
          <SetupHooks {...props}>{children}</SetupHooks>
        ) : (
          // @ts-ignore
          children(props)
        )
      }
    </TinaCloudProvider>
  )
}
export default Tina

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)

    this.state = { hasError: props.hasError }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  /**
   * Ideally we can track the last valid state and provide a button to go back, which
   * would just reset the form to that state. This isn't ideal for many cases though,
   * in general you'd probably want to push through the invalid state until you arrive at
   * a new state which you are happy with. So we should offer the opportunity to try rendering
   * again in the new, hopefully valid, state.
   */
  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <>
          <p>
            The code is likely assuming the existence of data which is not
            guaranteed to be there
          </p>
          <p>
            Try to fix the form and when you're ready to see if it worked click{' '}
            <button onClick={() => this.setState({ hasError: false })}>
              here
            </button>
          </p>
          <p>
            If you'd like to go back to the last valid state, click
            <button onClick={() => alert('not yet implemented')}>here</button>
          </p>
        </>
      )
    }

    return this.props.children
  }
}
