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

import { NextApiRequest, NextApiResponse } from 'next'

export interface TinaCloudUser {
  id: string
  email: string
  verified: boolean
  role: 'admin' | 'user'
  enabled: boolean
  fullName: string
}

/*
 *
 */
export const isAuthorized = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<TinaCloudUser | undefined> => {
  const org = req.query.org
  const clientID = req.query.clientID
  const token = req.headers.authorization
  if (
    typeof org === 'string' &&
    typeof clientID === 'string' &&
    typeof token === 'string'
  ) {
    try {
      // fetch identity from content server
      const tinaCloudRes = await fetch(
        'https://identity.tinajs.io/realm/logan/1o2sfba0u5t82qcsk16dtl7149/currentUser',
        {
          headers: new Headers({
            'Content-Type': 'application/json',
            authorization: token,
          }),
          method: 'GET',
        }
      )
      if (tinaCloudRes.ok) {
        const user: TinaCloudUser = await tinaCloudRes.json()
        return user
      }
    } catch (e) {
      console.error(e)
      return undefined
    }
  }
  return undefined
}
