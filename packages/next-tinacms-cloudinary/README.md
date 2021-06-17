# _next-tinacms-cloudinary_

This package support for managing the **Cloudinary media assets** for a site.

## Installation

```bash
yarn add next-tinacms-cloudinary
```

## Connect with Cloudinary
You will need some credentials provided by Cloudinary to set this up properly. If you do not already have an account, you may follow this (link)[https://cloudinary.com/users/register/free].

**next-tinacms-cloudinary** uses environment variables within the context of a Next.js site to properly access your Cloudinary account.

Add the following variables to a ```.env``` file.

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<Your Cloudinary Cloud Name>
NEXT_PUBLIC_CLOUDINARY_API_KEY=<Your Cloudinary API key>
CLOUDINARY_API_SECRET=<Your Cloudinary API secret>
```
## Register the Media Store
Now, you can register the Cloudinary Media store with the instance of Tina in your app.

```
import { CloudinaryMediaStore } from 'next-tinacms-cloudinary'

...
const cms = new TinaCMS({
  ---
  media: new CloudinaryMediaStore(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  ),
  ---
})
...
```

## Set up API routes
Set up a new api route in the ```pages``` directory of your Next.js app.

e.g. ```pages/api/cloudinary```

Then add a new catch all api route for media

```
//[...media].ts

import {
  mediaHandlerConfig,
  createMediaHandler,
} from 'next-tinacms-cloudinary/dist/handlers'

export const config = mediaHandlerConfig

export default createMediaHandler({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})
```

## Update Schema
Now that the media store is registered and the api route for media set up, let's add an image to your schema

In your ```.tina/schema.ts``` add a new field for the image

```
 {
  name: 'hero',
  type: 'image',
  label: 'Hero Image',
 }
 ```

 Now, when editing your site, the image field will allow you to connect to your Cloudinary account via the Media Store to manage your media assets.

