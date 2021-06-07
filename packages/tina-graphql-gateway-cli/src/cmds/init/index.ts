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
