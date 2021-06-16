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
  const query = req.query
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
