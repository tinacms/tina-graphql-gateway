import * as React from 'react'
import {
  E_UNAUTHORIZED,
  E_CLOUD_NAME,
  E_DEFAULT,
  CloudinaryError,
  E_API_KEY,
  E_API_SECRET,
  E_KEY_FAIL,
  E_BAD_ROUTE,
} from './errors'
//import { MediaListErrorPlugin } from 'tinacms'

const ListErrorComponent = ({ error }: { error: CloudinaryError }) => {
  let errorDetails = {
    title: 'An Error Occurred',
    description: 'Something went wrong fetching your media from Cloudinary.',
    link: 'https://tina.io/packages/next-tinacms-cloudinary',
  }

  switch (error.code) {
    case E_UNAUTHORIZED:
      errorDetails = {
        title: 'Unauthorized',
        description: E_UNAUTHORIZED.description,
        link: 'https://tina.io/packages/next-tinacms-cloudinary',
      }
      break
    case E_BAD_ROUTE:
      errorDetails = {
        title: 'Bad Route',
        description: 'The Cloudinary API route is missing or misconfigured.',
        link: 'https://tina.io/packages/next-tinacms-cloudinary/#set-up-api-routes',
      }
      break
    case E_CLOUD_NAME:
    case E_API_KEY:
    case E_API_SECRET:
      errorDetails = {
        title: 'Missing Credentials',
        description:
          'Unable to connect to Cloudinary because one or more environment variables are missing.',
        link: 'https://tina.io/packages/next-tinacms-cloudinary/#connect-with-cloudinary',
      }
      break
    case E_KEY_FAIL:
      errorDetails = {
        title: 'Bad Credentials',
        description:
          'Unable to connect to Cloudinary because one or more environmenty variables are misconfigured.',
        link: 'https://tina.io/packages/next-tinacms-cloudinary/#connect-with-cloudinary',
      }
      break
  }

  return (
    <ErrorWrap>
      <h2>{errorDetails.title}</h2>
      <aside>{errorDetails.description}</aside>
      <a target="_blank" rel="noopener noreferer" href={errorDetails.link}>
        Learn More
      </a>
    </ErrorWrap>
  )
}

export const CloudinaryListErrorPlugin: any = {
  __type: 'media:ui',
  name: 'list-error',
  Component: ListErrorComponent,
}

const ErrorWrap = ({ children }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {children}
  </div>
)
