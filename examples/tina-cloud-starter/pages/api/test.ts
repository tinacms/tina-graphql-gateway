import { NextApiHandler } from 'next'
import { isAuthorized } from 'tina-cloud-next'
const test: NextApiHandler = async (req, res) => {
  const user = await isAuthorized(req, res)
  console.log({ user })
  if (user && user.verified) {
    console.log('this is a good user')
  } else {
    console.log('this is a bad user')
  }
  res.json({
    asdf: 'asdf',
    user: user,
  })
}

export default test
