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

import { NextApiRequest } from 'next'

export interface TinaCloudUser {
  id: string
  email: string
  verified: boolean
  role: 'admin' | 'user'
  enabled: boolean
  fullName: string
}

/**
 *
 * @description Takes in the `req` and returns `undefined` if there is no user and returns a `TinaCloudUser` if the user is logged in.
 *
 * @example
 * import { NextApiHandler } from 'next'
 * import { isAuthorized } from 'tina-cloud-next'
 * const apiHandler: NextApiHandler = async (req, res) => {
 *   const user = await isAuthorized(req)
 *   if (user && user.verified) {
 *       res.json({
 *         validUser: true,
 *        })
 *       return
 *   } else {
 *     console.log('this user NOT is logged in')
 *     res.json({
 *      validUser: false,
 *      })
 *   }
 *}
 * export default apiHandler
 *
 * @param {NextApiRequest} req - the request. It must contain a req.query.org, req.query.clientID and req.headers.authorization
 *
 */
export const isAuthorized = async (
  req: NextApiRequest
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
        `https://identity.tinajs.io/v2/apps/${clientID}/currentUser`,
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
      throw e
    }
  }
  const errorMessage = (queryParam: string) => {
    return `An ${queryParam} query param is required for isAuthorized function but not found please use cms.api.tina.fetchWithToken('/api/something?org=orgID&clientID=YourClientID')`
  }
  !org && console.error(errorMessage('org'))
  !clientID && console.error(errorMessage('clientID'))
  !token &&
    console.error(
      'A authorization header was not found. Please use the cms.api.tina.fetchWithToken function on the frontend'
    )
  return undefined
}
