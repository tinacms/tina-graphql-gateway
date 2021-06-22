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

import React, { useEffect } from 'react'
import { TinaCMS, useCMS } from 'tinacms'
import { TinaCloudAuthWall, Client } from 'tina-graphql-gateway'
import { SidebarPlaceholder } from './helper-components'
import { createClient } from '../utils'
import { useGraphqlForms } from 'tina-graphql-gateway'
import {
  TinaCLoudCloudinaryMediaStore,
  CloudinaryMediaStore,
} from 'next-tinacms-cloudinary'
import { LoadingPage } from './Spinner'
const client = createClient()

/**
 * This gets loaded dynamically in "pages/_app.js"
 * if you're on a route that starts with "/admin"
 */
const TinaWrapper = (props) => {
  const cms = React.useMemo(() => {
    return new TinaCMS({
      apis: {
        tina: client,
      },
      sidebar: {
        placeholder: SidebarPlaceholder,
      },
      enabled: true,
    })
  }, [])

  cms.media.store = new TinaCLoudCloudinaryMediaStore(client)

  return (
    <TinaCloudAuthWall cms={cms}>
      <Inner {...props} />
    </TinaCloudAuthWall>
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
        <>
          <LoadingPage />
          <div
            style={{
              pointerEvents: 'none',
            }}
          >
            {props.children(props)}
          </div>
        </>
      ) : (
        // pass the new edit state data to the child
        props.children({ ...props, data: payload })
      )}
    </>
  )
}

export default TinaWrapper
