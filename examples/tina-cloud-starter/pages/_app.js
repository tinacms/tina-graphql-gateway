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

import dynamic from 'next/dynamic'
import { TinaEditProvider } from 'tina-graphql-gateway/dist/light'
const Tina = dynamic(() => import('tina-graphql-gateway'), { ssr: false })

// Our app is wrapped with edit provider
function App({ Component, pageProps }) {
  return (
    <TinaEditProvider
      editMode={
        <Tina
          config={{
            branch: 'main',
            clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
            organization: process.env.NEXT_PUBLIC_ORGANIZATION_NAME,
            isLocalClient: Boolean(
              Number(process.env.NEXT_PUBLIC_USE_LOCAL_CLIENT)
            ),
            mediaStore: TinaCloudCloudinaryMediaStore,
          }}
          {...pageProps}
        >
          {(livePageProps) => <Component {...livePageProps} />}
        </Tina>
      }
    >
      <Component {...pageProps} />
    </TinaEditProvider>
  )
}

export default App
