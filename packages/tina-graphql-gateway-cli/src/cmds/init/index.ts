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
import fs from 'fs-extra'
import p, { join } from 'path'

import { successText, logText, cmdText } from '../../utils/theme'
import { blogPost, nextPostPage } from './setup-files'

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
  console.log(successText('Sit back and relax while we set up Tina for you…'))
  next()
}

export async function installDeps(ctx: any, next: () => void, options) {
  const deps = [
    'tinacms',
    'styled-components',
    'tina-graphql-gateway',
    'tina-graphql-gateway-cli',
  ]
  const installCMD = `yarn add ${deps.join(' ')}`
  console.log(logText('Installing dependencies...'))
  console.log(cmdText(installCMD))
  await execShellCommand(installCMD)
  next()
}

const baseDir = process.cwd()
const blogContentPath = p.join(baseDir, 'content', 'blog')
const blogPostPath = p.join(blogContentPath, 'HelloWorld.md')
export async function tinaSetup(ctx: any, next: () => void, options) {
  console.log(logText('Setting up Tina...'))

  // 1 Create a content/blog Folder and add one or two blog posts

  if (!fs.pathExistsSync(blogPostPath)) {
    console.log(logText('Adding a content folder...'))
    fs.mkdirpSync(blogContentPath)
    fs.writeFileSync(blogPostPath, blogPost)
  }

  // 2 Create a /page/blog/[slug].tsx file with all of the Tina pieces wrapped up in one file
  const useingSrc = fs.pathExistsSync(p.join(baseDir, 'src'))
  const pagesPath = p.join(baseDir, useingSrc ? 'src' : '', 'pages')
  const tinaBlogPagePath = p.join(pagesPath, 'demo', 'blog')
  const tinaBlogPagePathFile = p.join(tinaBlogPagePath, '[slug].tsx')
  if (!fs.pathExistsSync(tinaBlogPagePathFile)) {
    fs.mkdirpSync(tinaBlogPagePath)
    fs.writeFileSync(tinaBlogPagePathFile, nextPostPage)
  }

  next()
}

export async function successMessage(ctx: any, next: () => void, options) {
  const baseDir = process.cwd()

  console.log(`
`Tina Cloud is now properly setup.`
✅ Installed Tina Dependencies 
✅ Setup a ${successText('basic Schema')} in ${join(
    baseDir,
    '.tina',
    'schema.ts'
  )}
✅ Generated ${successText('Typescript Types')} based on the Schema in ${join(
    baseDir,
    '.tina',
    '__generated__',
    'types.ts'
  )}
✅ Generated a ${successText('Graphql Schema')} in ${join(
    baseDir,
    '.tina',
    '__generated__',
    'schema.gql'
  )}
✅ Setup a your first post in ${blogPostPath}

✅ ${successText(
    'Setup a page basic Tina Page 🎉'
  )} start your dev server with 'next dev' and go to http://locahost:3000/demo/blog/HelloWorld.md to check it out"


For more Information visit our docs and checkout our getting starter guide

Dos: https://tina.io/docs/tina-cloud/
Getting starter guide: https://tina.io/guides/tina-cloud/starter/overview/
`)
  next()
}
