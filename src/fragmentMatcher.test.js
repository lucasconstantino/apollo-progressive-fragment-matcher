import gql from 'graphql-tag'
import { print } from 'graphql/language'
import { ApolloClient } from 'apollo-client'
import { ApolloLink, Observable } from 'apollo-link'
import { InMemoryCache } from 'apollo-cache-inmemory'

import { ProgressiveFragmentMatcher } from './fragmentMatcher'

describe('ProgressiveFragmentMatcher', () => {
  const newClient = (...results) => {
    const fragmentMatcher = new ProgressiveFragmentMatcher()
    const handler = jest.fn(() => Observable.of(results.shift()))

    const client = new ApolloClient({
      cache: new InMemoryCache({ fragmentMatcher }),
      link: ApolloLink.from([fragmentMatcher.link(), new ApolloLink(handler)])
    })

    return { client, handler }
  }

  it('should instantiate a new fragment matcher', () => {
    const fragmentMatcher = new ProgressiveFragmentMatcher()
    expect(fragmentMatcher).toBeInstanceOf(ProgressiveFragmentMatcher)
  })

  it('should throw when unknown strategy', () => {
    expect(
      () =>
        new ProgressiveFragmentMatcher({
          strategy: 'unkwnown'
        })
    ).toThrow(/unknown strategy/)
  })

  it('should fetch a scalar field', async () => {
    const data = { field: 'bar' }
    const { client } = newClient({ data })
    const query = gql`
      {
        field
      }
    `

    const result = await client.query({ query })

    expect(result).toHaveProperty('data.field', 'bar')
  })

  it('should fetch an object', async () => {
    const data = { obj: { __typename: 'Obj', field: 'bar' } }
    const { client } = newClient({ data })
    const query = gql`
      {
        obj {
          field
        }
      }
    `

    const result = await client.query({ query })

    expect(result).toHaveProperty('data.obj.field', 'bar')
  })

  describe('strategy: extension', () => {
    const newClient = (...results) => {
      const fragmentMatcher = new ProgressiveFragmentMatcher({
        strategy: 'extension'
      })
      const handler = jest.fn(() => Observable.of(results.shift()))

      const client = new ApolloClient({
        cache: new InMemoryCache({ fragmentMatcher }),
        link: ApolloLink.from([fragmentMatcher.link(), new ApolloLink(handler)])
      })

      return { client, handler }
    }

    it('should send extension enabled flag', async () => {
      const data = { field: 'bar' }
      const { client, handler } = newClient({ data })
      const query = gql`
        {
          field
        }
      `

      await client.query({ query })

      expect(handler).toHaveBeenCalledTimes(1)

      expect(handler).toHaveProperty(
        'mock.calls.0.0.extensions.possibleTypes',
        true
      )
    })

    it('should fetch a direct type fragment', async () => {
      const data = { obj: { __typename: 'Obj', field: 'bar' } }
      const extensions = { possibleTypes: { Obj: ['Obj'] } }
      const { client } = newClient({ data, extensions })
      const query = gql`
        {
          obj {
            ... on Obj {
              field
            }
          }
        }
      `

      const result = await client.query({ query })

      expect(result).toHaveProperty('data.obj.field', 'bar')
    })

    it('should fetch an inheriting fragment', async () => {
      const data = { obj: { __typename: 'Obj', field: 'bar' } }
      const extensions = { possibleTypes: { Obj: ['ParentType'] } }
      const { client } = newClient({ data, extensions })
      const query = gql`
        {
          obj {
            ... on ParentType {
              field
            }
          }
        }
      `

      const result = await client.query({ query })

      expect(result).toHaveProperty('data.obj.field', 'bar')
    })

    it('should fetch on multiple inheriting fragments', async () => {
      const data = {
        characters: [
          { __typename: 'Human', name: 'Luke', height: '180' },
          { __typename: 'Droid', name: 'R2D2', primaryFunction: 'joke' }
        ]
      }
      const extensions = {
        possibleTypes: {
          Human: ['Character'],
          Droid: ['Character']
        }
      }

      const { client } = newClient({ data, extensions })
      const query = gql`
        fragment characterFields on Character {
          name

          ... on Droid {
            primaryFunction
          }

          ... on Human {
            height
          }
        }

        query {
          characters {
            __typename
            ...characterFields
          }
        }
      `

      const result = await client.query({ query })

      expect(result).toHaveProperty('data.characters.0.name', 'Luke')
      expect(result).toHaveProperty('data.characters.0.height', '180')
      expect(result).toHaveProperty('data.characters.1.name', 'R2D2')
      expect(result).toHaveProperty('data.characters.1.primaryFunction', 'joke')
    })
  })

  describe('strategy: introspection', () => {
    const newClient = (...results) => {
      const fragmentMatcher = new ProgressiveFragmentMatcher({
        strategy: 'introspection'
      })
      const handler = jest.fn(() => Observable.of(results.shift()))

      const client = new ApolloClient({
        cache: new InMemoryCache({ fragmentMatcher }),
        link: ApolloLink.from([fragmentMatcher.link(), new ApolloLink(handler)])
      })

      return { client, handler }
    }

    it('should fetch a direct type fragment', async () => {
      const data = { obj: { __typename: 'Obj', field: 'bar' }, __Obj__: null }
      const { client } = newClient({ data })
      const query = gql`
        {
          obj {
            ... on Obj {
              field
            }
          }
        }
      `

      const result = await client.query({ query })

      expect(result).toHaveProperty('data.obj.field', 'bar')
    })

    it('should append type introspections', async () => {
      const data = { obj: null, __Obj__: null }
      const { client, handler } = newClient({ data })
      const query = gql`
        {
          obj {
            ... on Obj {
              field
            }
          }
        }
      `

      const expectedQuery = gql`
        {
          obj {
            ... on Obj {
              field
              __typename
            }
            __typename
          }

          __Obj__: __type(name: "Obj") {
            possibleTypes {
              name
            }
          }
        }
      `

      await client.query({ query })

      const operation = handler.mock.calls[0][0]

      expect(print(operation.query)).toBe(print(expectedQuery))
    })

    it('should fetch an inheriting fragment', async () => {
      const data = {
        obj: { __typename: 'Obj', field: 'bar' },
        __ParentType__: {
          possibleTypes: [{ name: 'Obj' }]
        }
      }
      const { client } = newClient({ data })
      const query = gql`
        {
          obj {
            ... on ParentType {
              field
            }
          }
        }
      `

      const result = await client.query({ query })

      expect(result).toHaveProperty('data.obj.field', 'bar')
    })

    it('should fetch on multiple inheriting fragments', async () => {
      const data = {
        characters: [
          { __typename: 'Human', name: 'Luke', height: '180' },
          { __typename: 'Droid', name: 'R2D2', primaryFunction: 'joke' }
        ],
        __Character__: {
          possibleTypes: [{ name: 'Human' }, { name: 'Droid' }]
        },
        __Droid__: {
          possibleTypes: null
        },
        __Human__: {
          possibleTypes: null
        }
      }

      const { client } = newClient({ data })

      const query = gql`
        fragment characterFields on Character {
          name

          ... on Droid {
            primaryFunction
          }

          ... on Human {
            height
          }
        }

        query {
          characters {
            ...characterFields
          }
        }
      `

      const result = await client.query({ query })

      expect(result).toHaveProperty('data.characters.0.name', 'Luke')
      expect(result).toHaveProperty('data.characters.0.height', '180')
      expect(result).toHaveProperty('data.characters.1.name', 'R2D2')
      expect(result).toHaveProperty('data.characters.1.primaryFunction', 'joke')
    })

    it('should NOT append type introspections on second requests', async () => {
      const first = {
        result: { data: { first: null, __Obj__: null } },
        query: gql`
          query FIRST {
            first {
              ... on Obj {
                field
              }
            }
          }
        `,
        transformed: gql`
          query FIRST {
            first {
              ... on Obj {
                field
                __typename
              }
              __typename
            }

            __Obj__: __type(name: "Obj") {
              possibleTypes {
                name
              }
            }
          }
        `
      }

      const second = {
        result: { data: { second: null } },
        query: gql`
          query SECOND {
            second {
              ... on Obj {
                field
              }
            }
          }
        `,
        transformed: gql`
          query SECOND {
            second {
              ... on Obj {
                field
                __typename
              }
              __typename
            }
          }
        `
      }

      const { client, handler } = newClient(first.result, second.result)

      await client.query({ query: first.query })
      await client.query({ query: second.query })

      expect(handler).toHaveBeenCalledTimes(2)

      const operations = {
        first: handler.mock.calls[0][0],
        second: handler.mock.calls[1][0]
      }

      expect(print(operations.first.query)).toBe(print(first.transformed))
      expect(print(operations.second.query)).toBe(print(second.transformed))
    })
  })
})
