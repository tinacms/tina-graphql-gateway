import React from 'react'
import { useCMS } from 'tinacms'

export const BranchSwitcher = ({ branches }) => {
  const cms = useCMS()
  const onChange = React.useCallback(
    (event) => {
      cms.api.tina.changeBranch(event.target.value)
    },
    [cms.api.tina]
  )
  return (
    <select onChange={onChange}>
      {branches.map((branch) => (
        <option value={branch}>{branch}</option>
      ))}
    </select>
  )
}
