import { ApolloServer } from 'apollo-server'
import { createTestClient } from 'apollo-server-testing'
import { addTypenameToDocument } from 'apollo-utilities'
import graphql from 'graphql-tag'

import { PossibleTypesExtension } from './extension'

// composed version for simplicity.
const gql = (...args) => addTypenameToDocument(graphql(...args))

const characters = [
  { type: 'human', name: 'Luke', height: '180' },
  { type: 'droid', name: 'R2D2', primaryFunction: 'joke' },
  { type: 'human', name: 'Leia', height: '165' },
  { type: 'droid', name: 'C-3PO', primaryFunction: 'complain' }
]

const planets = [
  { type: 'planet', name: 'Naboo', sector: 'Arkanis' },
  { type: 'planet', name: 'Tatooine', sector: 'Chommell' }
]

const typeDefs = graphql`
  interface Character {
    name: String!
  }

  type Planet {
    name: String!
    region: String!
  }

  type Human implements Character {
    name: String!
    height: String!
  }

  type Droid implements Character {
    name: String!
    primaryFunction: String!
  }

  union Named = Human | Planet

  type Query {
    human(name: String!): Human
    droid(name: String!): Droid
    character(name: String!): Character
    characters: [Character]
    named(name: String!): Named
  }
`

const map = {
  Human: ['Character'],
  Droid: ['Character']
}

const typenames = { human: 'Human', droid: 'Droid', planet: 'Planet' }

const resolvers = {
  Query: {
    human: (root, { name }) =>
      characters.find(char => char.name === name && char.type === 'human'),

    droid: (root, { name }) =>
      characters.find(char => char.name === name && char.type === 'droid'),

    character: (root, { name }) => characters.find(char => char.name === name),

    characters: () => characters,

    named: (root, { name }) =>
      [].concat(characters, planets).find(named => named.name === name)
  },
  Character: {
    __resolveType: ({ type }) => typenames[type]
  },
  Named: {
    __resolveType: ({ type }) => typenames[type]
  }
}

describe('PossibleTypesExtension', () => {
  const newClient = () => {
    const possibleTypesExtension = () => new PossibleTypesExtension()
    const extensions = [possibleTypesExtension]

    return createTestClient(
      new ApolloServer({
        typeDefs,
        resolvers,
        extensions
      })
    )
  }

  it('should instantiate a new extension', () => {
    const fragmentMatcher = new PossibleTypesExtension()
    expect(fragmentMatcher).toBeInstanceOf(PossibleTypesExtension)
  })

  it('should perform a simple query', async () => {
    const client = newClient()
    const query = gql`
      {
        human(name: "Luke") {
          name
          height
        }

        droid(name: "R2D2") {
          name
          primaryFunction
        }
      }
    `

    const result = await client.query({ query })

    expect(result).toHaveProperty('data.human.name', 'Luke')
    expect(result).toHaveProperty('data.human.height', '180')
    expect(result).toHaveProperty('data.droid.name', 'R2D2')
    expect(result).toHaveProperty('data.droid.primaryFunction', 'joke')
  })

  it('should return possible interface types when requested', async () => {
    const client = newClient()
    const query = gql`
      {
        droid(name: "R2D2") {
          name
          primaryFunction
        }
      }
    `

    const extensions = { possibleTypes: true }
    const result = await client.query({ query, extensions })

    expect(result).toHaveProperty('data.droid.name', 'R2D2')
    expect(result).toHaveProperty('data.droid.primaryFunction', 'joke')
    expect(result).toHaveProperty('extensions.possibleTypes.Droid', map.Droid)
  })

  it('should return possible types when requesting a union', async () => {
    const client = newClient()
    const query = gql`
      {
        named(name: "Luke") {
          ... on Human {
            name
            height
          }
        }
      }
    `

    const extensions = { possibleTypes: true }
    const result = await client.query({ query, extensions })

    expect(result).toHaveProperty('data.named.name', 'Luke')
    expect(result).toHaveProperty('data.named.height', '180')
    expect(result).toHaveProperty('extensions.possibleTypes.Human', map.Human)
  })

  it('should return multiple possible type maps', async () => {
    const client = newClient()
    const query = gql`
      {
        human(name: "Luke") {
          name
          height
        }

        droid(name: "R2D2") {
          name
          primaryFunction
        }
      }
    `

    const extensions = { possibleTypes: true }
    const result = await client.query({ query, extensions })

    expect(result).toHaveProperty('extensions.possibleTypes.Human', map.Human)
    expect(result).toHaveProperty('extensions.possibleTypes.Droid', map.Droid)
  })
})
