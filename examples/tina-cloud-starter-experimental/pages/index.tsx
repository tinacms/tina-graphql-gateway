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

import { LandingPage } from '../components/landing-page'
import { Wrapper } from '../components/helper-components'
import { AsyncReturnType } from './posts/[filename]'
import { LocalClient } from 'tina-graphql-gateway'
import type { MarketingPagesDocument } from '../.tina/__generated__/types'

export default function HomePage(
  props: AsyncReturnType<typeof getStaticProps>['props']
) {
  return (
    <Wrapper data={props.data.getMarketingPagesDocument.data}>
      <LandingPage {...props.data.getMarketingPagesDocument.data} />
    </Wrapper>
  )
}

const gql = (strings: TemplateStringsArray) => strings

export const query = gql`
  query ContentQuery {
    # "index.md" is _relative_ to the "Marketing Pages" path property in your schema definition
    # you can inspect this file at "content/marketing-pages/index.md"
    getMarketingPagesDocument(relativePath: "index.md") {
      data {
        __typename
        ... on MarketingPagesLandingPage {
          blocks {
            __typename
            ... on MarketingPagesLandingPageBlocksImage {
              heading
              imgDescription
              src
            }
            ... on MarketingPagesLandingPageBlocksMessage {
              messageHeader
              messageBody
            }
          }
        }
      }
    }
    getPostsDocument(relativePath: "voteForPedro.md") {
      data {
        __typename
        ... on PostsArticle {
          title
          hero
          author {
            __typename
            ... on AuthorsDocument {
              data {
                __typename
                ... on AuthorsAuthor {
                  name
                  avatar
                }
              }
            }
          }
        }
      }
    }
  }
`

const client = new LocalClient()
export const getStaticProps = async () => {
  return {
    props: {
      data: await client.request<{
        getMarketingPagesDocument: MarketingPagesDocument
      }>(query.join(''), {
        variables: {},
      }),
      query: query,
      variables: {},
    },
  }
}