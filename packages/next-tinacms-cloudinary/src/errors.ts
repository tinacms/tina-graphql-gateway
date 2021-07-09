export const E_UNAUTHORIZED = Symbol('Unauthorized user')
export const E_CLOUD_NAME = Symbol('Missing cloud_name')
export const E_API_KEY = Symbol('Missing api_key')
export const E_API_SECRET = Symbol('Missing api_secret')
export const E_KEY_FAIL = Symbol('Invalid credentials')
export const E_DEFAULT = Symbol('There was a problem requesting the resource')
export const E_BAD_ROUTE = Symbol('Media route missing or misconfigured')

export class CloudinaryError extends Error {
  constructor(public code: Symbol) {
    super(code.description)
  }
}

export const interpretErrorMessage = (message: string) => {
  switch (message) {
    case 'Must supply cloud_name':
      return E_CLOUD_NAME
    case 'Must supply api_key':
      return E_API_KEY
    case 'Must supply api_secret':
      return E_API_SECRET
    case 'unknown api_key':
      return E_KEY_FAIL
    default:
      return E_DEFAULT
  }
}
