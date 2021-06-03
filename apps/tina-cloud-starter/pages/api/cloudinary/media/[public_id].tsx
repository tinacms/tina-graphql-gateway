import { ResourceApiResponse, v2 as cloudinary } from 'cloudinary'
import { NextApiRequest, NextApiResponse } from 'next'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default function handleMediaRequest(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { public_id } = req.query

  if (req.method === 'DELETE') {
    cloudinary.uploader.destroy(public_id as string, {}, (err) => {
      if (err) res.status(500)
      res.json({
        err,
        public_id,
      })
    })
  }
}
