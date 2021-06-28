import path from 'path'
import { setup, setupFixture } from '../setup'

const rootPath = path.join(__dirname, '/')

const fixtures = [
  'getMovieDocument',
  'getDocument',
  'getDirectorList',
  'addPendingDocument',
  'updateDocument',
  'getDirectorDocument',
  'getCollections',
  'getCollection',
]
import { tinaSchema } from './.tina/schema'

describe('The given configuration', () => {
  it('Matches the expected schema', async () => {
    const { schemaString, expectedSchemaString } = await setup(
      rootPath,
      tinaSchema,
      true
    )
    expect(schemaString).toEqual(expectedSchemaString)
  })
  fixtures.forEach((fixture) => {
    it(`${fixture} works`, async () => {
      const { response, expectedReponse } = await setupFixture(
        rootPath,
        tinaSchema,
        fixture
      )

      expect(response).toEqual(JSON.parse(expectedReponse))
    })
  })
})
