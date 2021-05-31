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

import { dangerText } from './utils/theme'

export const chain = async (
  cmds: ((ctx: any, next: any, options: any) => Promise<void>)[],
  options: any
) => {
  let ctx = {}

  const next = async (middlewareIndex: number) => {
    if (middlewareIndex >= cmds.length) {
      process.exit(0)
    }
    try {
      await cmds[middlewareIndex](
        ctx,
        () => next(middlewareIndex + 1),
        options || {}
      )
    } catch (err) {
      console.error(`  ${dangerText(err)}`)
      process.exit(1)
    }
  }

  if (cmds.length > 0) {
    await next(0)
  }
}
