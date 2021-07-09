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

import { Client, LocalClient } from '../client'
export * from './editState'
export interface CreateClientProps {
  organization?: string
  clientId?: string
  isLocalClient?: boolean
  branch?: string
}
export const createClient = ({
  organization,
  clientId,
  isLocalClient = true,
  branch,
}: CreateClientProps) => {
  return isLocalClient
    ? new LocalClient()
    : createCloudClient({ organization, clientId, branch })
}

export const createCloudClient = (
  props: Omit<CreateClientProps, 'isLocalClient'>
) => {
  const clientId = props.clientId

  const missingProps: string[] = []

  if (!clientId) {
    missingProps.push('clientId')
  }

  if (missingProps.length) {
    throw new Error(`The following props are required when using the Tina Cloud Client, please make sure they are being passed to TinaCloudAuthWall:
     ${missingProps.join(', ')}`)
  }

  return new Client({
    clientId,
    branch: props.branch || 'main',
    tokenStorage: 'LOCAL_STORAGE',
  })
}
