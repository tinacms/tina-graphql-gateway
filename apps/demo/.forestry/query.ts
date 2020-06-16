// DO NOT MODIFY THIS FILE. This file is automatically generated by Forestry
export default `query DocumentQuery($path: String!) {
  document(path: $path) {
    __typename
    ... on Post {
      __typename
      form {
        fields {
          ... on SelectFormField {
            name
            options
          }
        }
      }
      path
      content
      excerpt
      data {
        title
        image {
          path
          absolutePath
        }
        hashtags
        author {
          ... on Author {
            path
            data {
              name
              image {
                path
                absolutePath
              }
            }
          }
        }
      }
    }
    ... on BlockPage {
      form {
        fields {
          ... on TextFormField {
            name
            label
            component
          }
          ... on BlocksFieldConfig {
            name
            label
            component
            templates {
              AuthorListFieldConfig {
                label
                key
                fields {
                  ... on AuthorsListAuthorListConfig {
                    name
                    label
                    component
                    itemField {
                      name
                      label
                      component
                      options
                    }
                  }
                }
              }
              SponsorListFieldConfig {
                name
                label
                component
                fields {
                  ...on TextFormField {
                    name
                    label
                    value
                    component
                  }
                  ...on SponsorFieldsListSponsorListConfig {
                    label
                    key
                    name
                    component
                    fields {
                      ...on TextFormField {
                        name
                        label
                        component
                      }
                      ...on ImageFormField {
                        name
                        label
                        component
                      }
                    }
                  }
                }
              }
              PageReferenceFieldConfig {
                label
                key
                name
                fields {
                  ...on TextFormField {
                    name
                    label
                    value
                    component
                  }
                  ...on SelectFormField {
                    name
                    label
                    value
                    component
                    options
                  }
                }
              }
              SidecarFieldConfig {
                label
                key
                fields {
                  ... on TextFormField {
                    name
                    label
                    component
                  }
                  ... on ImageFormField {
                    name
                    label
                    component
                  }
                  ... on CtaFieldsListSidecarConfig {
                    label
                    key
                    component
                    fields {
                      ... on TextFormField {
                        name
                        label
                        component
                      }
                    }
                  }
                  ... on ActionsFieldConfig {
                    name
                    label
                    component
                    templates {
                      ActionVideoFieldConfig {
                        label
                        key
                        component
                        fields {
                          ... on TextFormField {
                            label
                            name
                            component
                          }
                        }
                      }
                      ActionNewsletterFieldConfig {
                        label
                        key
                        component
                        fields {
                          ... on TextFormField {
                            label
                            name
                            component
                          }
                        }
                      }
                      ActionPageReferenceFieldConfig {
                        label
                        key
                        component
                        fields {
                          ... on SelectFormField {
                            name
                            label
                            component
                            options
                          }
                          ... on ButtonSettingsFieldsListActionPageReferenceConfig {
                            label
                            key
                            component
                            fields {
                              ... on TextFormField {
                                name
                                label
                                component
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  ... on SelectFormField {
                    name
                    label
                    component
                    options
                  }
                }
              }
              SectionIndexFieldConfig {
                label
                key
                fields {
                  ... on TextFormField {
                    name
                    label
                    component
                  }
                  ... on SelectFormField {
                    name
                    label
                    component
                    options
                  }
                }
              }
              PriceListFieldConfig {
                label
                key
                fields {
                  ... on TextFormField {
                    name
                    label
                    component
                  }
                  ... on PricesFieldsListPriceListConfig {
                    label
                    key
                    component
                    name
                    fields {
                      ... on TextFormField {
                        name
                        label
                        component
                      }
                      ... on BulletPointsListPriceListPricesConfig {
                        name
                        label
                        component
                        itemField {
                          name
                          label
                          component
                        }
                      }
                      ... on SelectFormField {
                        name
                        label
                        options
                        component
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      data {
        __typename
        _template
        title
        blocks {
        	__typename
          ... on ExcerptPostData {
            __typename
            _template
            style
            post {
              __typename
              ... on Post {
                path
                excerpt
                data {
                  image {
                    path
                    absolutePath
                  }
                  title
                  author {
                    ... on Author {
                      data {
                        name
                        image {
                          path
                          absolutePath
                        }
                      }
                    }
                  }
                }
              }
            }
            description
          }
          ... on PageReferenceData {
            _template
            description
            page {
              __typename
              ... on BlockPage {
                path
              }
            }
          }
          ... on SidecarData {
            _template
            style
            text
            image {
              path
              absolutePath
            }
            cta {
              header
            }
            actions {
              ... on ActionPageReferenceData {
                _template
                page {
                  ... on BlockPage {
                    path
                  }
                }
                button_settings {
                  label
                }
              }
              ... on ActionVideoData {
                _template
                url
              }
              ... on ActionNewsletterData {
                _template
                body
                footer
              }
            }
          }
          ... on SponsorListData {
            _template
            description
            sponsor {
              name
              url
              image {
                path
                absolutePath
              }
            }
          }
          ... on AuthorListData {
            _template
            authors {
              __typename
              ... on Author {
                path
                content
                excerpt
                data {
                  name
                  image {
                    path
                    absolutePath
                  }
                  gallery {
                    path
                    absolutePath
                  }
                  anecdotes
                  accolades {
                    figure
                    description
                  }
                }
              }
            }
          }
          ... on PriceListData {
            _template
            heading
            prices {
              title
              description
              bullet_points
              category
            }
          }
          ... on SectionIndexData {
            _template
            body
            limit
            section {
              __typename
              ... on Post {
                path
                excerpt
                data {
                  hashtags
                  title
                  image {
                    path
                    absolutePath
                  }
                  author {
                    __typename
                    ... on Author {
                      path
                      content
                      excerpt
                      data {
                        name
                        image {
                          path
                          absolutePath
                        }
                        gallery {
                          path
                          absolutePath
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`
