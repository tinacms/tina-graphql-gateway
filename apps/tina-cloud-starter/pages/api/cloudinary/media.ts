import {
  mediaHandlerConfig,
  createMediaHandler,
} from '../../../next-tinacms-cloudinary/handlers'

export const config = mediaHandlerConfig

// TODO: make this route secure
export default createMediaHandler({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})
