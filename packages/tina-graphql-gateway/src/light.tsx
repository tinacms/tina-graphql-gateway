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

import React, { useContext, useState } from 'react'

/**
 * A passthru function which allows editors
 * to know the temlpate string is a GraphQL
 * query or muation
 */
function graphql(strings: TemplateStringsArray) {
  return strings[0]
}
export { graphql }

export const TinaEditProvider = (props) => {
  return (
    <EditProvider>
      <TinaEditProviderInner {...props} />
    </EditProvider>
  )
}

const TinaEditProviderInner = ({ children, editMode }) => {
  const { edit } = useEditState()
  if (edit) {
    return editMode
  }

  return children
}

const LOCALSTORAGEKEY = 'tina.isEditing'

// need this to see if our site is being rendered on the server
const isSSR = typeof window === 'undefined'

export const isEditing = (): boolean => {
  if (!isSSR) {
    const isEdit = window.localStorage.getItem(LOCALSTORAGEKEY)
    return isEdit && isEdit === 'true'
  }
  // assume not editing if SSR
  return false
}

export const setEditing = (isEditing: boolean) => {
  if (!isSSR) {
    window.localStorage.setItem(LOCALSTORAGEKEY, isEditing ? 'true' : 'false')
  }
}

const EditContext = React.createContext({
  edit: isEditing(),
  setEdit: (editing: boolean) => {},
})

/*
  We will wrap our app in this so we will always be able to get the editmode state with `useEditMode`
*/
export const EditProvider: React.FC = ({ children }) => {
  const [edit, setEditState] = useState(
    // grabs the correct initial edit state from localstorage
    isEditing()
  )
  const setEdit = (edit: boolean) => {
    // set React state and localstorage
    setEditState(edit)
    setEditing(edit)
    if (process.env.NODE_ENV === 'development') {
      // Force Next.js to fetch fresh data from the file system when in dev mode
      window.location.reload()
    }
  }
  return (
    <EditContext.Provider value={{ edit, setEdit }}>
      {children}
    </EditContext.Provider>
  )
}

export const useEditState = () => useContext(EditContext)
