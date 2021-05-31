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

import { AddContentPlugin, Field, TinaCMS } from 'tinacms'

type CollectionShape = {
  label: string
  format: string
  slug: string
}

interface CreateContentButtonOptions {
  label: string
  fields: any[]
  collections: CollectionShape[]
  onNewDocument: OnNewDocument
}

type FormShape = {
  collection: string
  collectionTemplate: string
  relativePath: string
}

type PayloadShape = {
  collection: string
  template: string
  relativePath: string
}

export type OnNewDocument = (args: {
  collection: { slug: string }
  relativePath: string
  breadcrumbs: string[]
  path: string
}) => void

export class ContentCreatorPlugin implements AddContentPlugin<FormShape> {
  __type: 'content-creator' = 'content-creator'
  fields: AddContentPlugin<FormShape>['fields']
  onNewDocument: OnNewDocument
  name: string
  collections: CollectionShape[]

  constructor(options: CreateContentButtonOptions) {
    this.fields = options.fields
    this.name = options.label
    this.onNewDocument = options.onNewDocument
    this.collections = options.collections
  }

  async onSubmit(
    { collectionTemplate, relativePath }: FormShape,
    cms: TinaCMS
  ) {
    /**
     * Split collectionTemplate into `collection` and `template`
     */
    const [collection, template] = collectionTemplate
      ? collectionTemplate.split('.')
      : this.fields
          .find((field) => field.name === 'collectionTemplate')
          // @ts-ignore - FIXME: we need a way to supply an initial value https://github.com/tinacms/tinacms/issues/1715
          .options[0].value.split('.')

    const selectedCollection = this.collections.find(
      (collectionItem) => collectionItem.slug === collection
    )
    const collectionFormat = selectedCollection.format

    /**
     * Check for and ensure `.md` or `.json` is appended to the end of `relativePath`
     */
    const extensionLength = -1 * (collectionFormat.length + 1)
    let relativePathWithExt = relativePath
    if (
      relativePath.slice(extensionLength).toLocaleLowerCase() ===
      `.${collectionFormat}`
    ) {
      relativePathWithExt = `${relativePath.slice(0, -3)}.${collectionFormat}`
    } else {
      relativePathWithExt = `${relativePath}.${collectionFormat}`
    }

    /**
     * Rebuild `payload`
     */
    const payload: PayloadShape = {
      relativePath: relativePathWithExt,
      collection,
      template,
    }

    try {
      const res = await cms.api.tina.addPendingContent(payload)
      if (res.errors) {
        res.errors.map((e) => {
          cms.alerts.error(e.message)
        })
      } else {
        cms.alerts.info('Document created!')
        if (typeof this.onNewDocument === 'function') {
          this.onNewDocument(res.addPendingDocument.sys)
        }
      }
    } catch (e) {
      cms.alerts.error(e.message)
    }
  }
}
