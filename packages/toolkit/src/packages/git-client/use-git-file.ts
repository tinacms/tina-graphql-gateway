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
import { useMemo } from 'react'
import { useCMS } from '../react-core'
import { GitFile } from './git-file'

export function useGitFile(
  relativePath: string,
  format: (file: any) => string,
  parse: (content: string) => any
) {
  const cms = useCMS()

  return useMemo(
    () => new GitFile(cms, relativePath, format, parse),
    [cms, relativePath, format, parse]
  )
}
