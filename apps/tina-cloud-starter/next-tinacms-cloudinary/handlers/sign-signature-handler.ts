import { NextApiHandler } from 'next'
import { v2 as cloudinary } from 'cloudinary'

// TODO: refactor this to return a nextAPIHandeler
export const signSignatureHandler: NextApiHandler = (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000)
  const params = JSON.parse((req.query.params as string) || '{}')
  console.log(params)

  const signature = cloudinary.utils.api_sign_request(
    {
      ...params,
      timestamp: timestamp,
    },
    process.env.CLOUDINARY_API_SECRET
  )
  res.json({ signature, timestamp })
}
