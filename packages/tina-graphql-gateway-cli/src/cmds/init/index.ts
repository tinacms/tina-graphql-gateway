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

import { successText, logText, cmdText } from '../../utils/theme'

/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
function execShellCommand(cmd): Promise<string> {
  const exec = require('child_process').exec
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error)
      }
      resolve(stdout ? stdout : stderr)
    })
  })
}

export async function initTina(ctx: any, next: () => void, options) {
  console.log(
    successText(
      'Welcome to tina Init process sit back and relax while we set up tina for you'
    )
  )
  next()
}

export async function installDeps(ctx: any, next: () => void, options) {
  const deps = [
    'tinacms',
    'styled-components',
    'tina-graphql-gateway',
    'tina-graphql-gateway-cli',
  ]
  console.log(logText('Installing dependencies...'))
  console.log(cmdText(`yarn add ${deps.join(' ')}`))
  //   TODO: Really install deps
  next()
}

export async function tinaSetup(ctx: any, next: () => void, options) {
  const deps = [
    'tinacms',
    'styled-components',
    'tina-graphql-gateway',
    'tina-graphql-gateway-cli',
  ]
  console.log(logText('Installing dependencies...'))
  console.log(cmdText(`yarn add ${deps.join(' ')}`))
  //   TODO: Really install deps
  next()
}
