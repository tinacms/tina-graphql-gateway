import { defineSchema } from 'tina-graphql-gateway-cli'

export default defineSchema({
  collections: [
    {
      label: 'Blog Posts',
      name: 'posts',
      path: 'content/posts',
      templates: [
        {
          label: 'Article',
          name: 'article',
          fields: [
            {
              type: 'text',
              label: 'Title',
              name: 'title',
            },
            {
              type: 'reference',
              label: 'Author',
              name: 'author',
              collection: 'authors',
            },
          ],
        },
      ],
    },
    {
      label: 'Authors',
      name: 'authors',
      path: 'content/authors',
      templates: [
        {
          label: 'Author',
          name: 'author',
          fields: [
            {
              type: 'text',
              label: 'Name',
              name: 'name',
            },
            {
              type: 'text',
              label: 'Avatar',
              name: 'avatar',
            },
          ],
        },
      ],
    },
  ],
})
