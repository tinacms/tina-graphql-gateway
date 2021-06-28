import fs from 'fs-extra'
import fg from 'fast-glob'
import path from 'path'

/**
 * This is the bridge from whatever datasource we need for I/O.
 * The basic example here is for the filesystem, one is needed
 * for Github has well.
 */
export class FilesystemBridge implements Bridge {
  public rootPath: string
  constructor(rootPath: string) {
    this.rootPath = rootPath || ''
  }
  public glob = async (pattern: string) => {
    const items = await fg(path.join(this.rootPath, pattern, '**/*'), {
      dot: true,
    })
    return items.map((item) => {
      return item.replace(this.rootPath, '').replace(/^\/|\/$/g, '')
    })
  }
  public get = async (filepath: string) => {
    return fs.readFileSync(path.join(this.rootPath, filepath)).toString()
  }
  public put = async (filepath: string, data: string) => {
    await fs.outputFileSync(path.join(this.rootPath, filepath), data)
  }
}

export interface Bridge {
  glob: (pattern: string) => Promise<string[]>
  get: (filepath: string) => Promise<string>
  put: (filepath: string, data: string) => Promise<void>
}
