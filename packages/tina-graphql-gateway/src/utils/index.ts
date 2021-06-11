import { Client, LocalClient } from '../client'
export * from './editState'
export interface CreateClientProps {
  organization?: string
  clientId?: string
  isLocalClient?: boolean
  branch?: string
}
export const createClient = ({
  organization,
  clientId,
  isLocalClient = true,
  branch,
}: CreateClientProps) => {
  return isLocalClient
    ? createLocalClient()
    : createCloudClient({ organization, clientId, branch })
}

export const createCloudClient = (
  props: Omit<CreateClientProps, 'isLocalClient'>
) => {
  const organization = props.organization
  const clientId = props.clientId

  const missingProps: string[] = []
  if (!organization) {
    missingProps.push('organization')
  }
  if (!clientId) {
    missingProps.push('clientId')
  }

  if (missingProps.length) {
    throw new Error(`The following props are required when using the Tina Cloud Client, please make sure they are being passed to TinaCloudAuthWall:
     ${missingProps.join(', ')}`)
  }

  return new Client({
    organizationId: organization,
    clientId,
    branch: props.branch || 'main',
    tokenStorage: 'LOCAL_STORAGE',
  })
}

/**
 * This is a GraphQL client that only talks to your local filesystem server,
 * as a result it's a great tool for static page building or local development.
 *
 * In this starter app you'll see it being used as both, with the
 * option to "switch on" the non-local client via environment variables.
 */
export const createLocalClient = () => {
  return new LocalClient()
}
