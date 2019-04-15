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

const typeDefs = graphql`
  interface Character {
    name: String!
  }

  type Human implements Character {
    name: String!
    height: String!
  }

  type Droid implements Character {
    name: String!
    primaryFunction: String!
  }

  type Query {
    human(name: String!): Human
    droid(name: String!): Droid
    character(name: String!): Character
    characters: [Character]
  }
`

const resolvers = {
  Query: {
    human: (root, { name }) =>
      characters.find(char => char.name === name && char.type === 'human'),

    droid: (root, { name }) =>
      characters.find(char => char.name === name && char.type === 'droid'),

    character: (root, { name }) => characters.find(char => char.name === name),

    characters: () => characters
  },
  Character: {
    __resolveType: ({ type }) => ({ human: 'Human', droid: 'Droid' }[type])
  }
}

describe('PossibleTypesExtension', () => {
  const newClient = () =>
    createTestClient(
      new ApolloServer({
        typeDefs,
        resolvers,
        extensions: [() => new PossibleTypesExtension()]
      })
    )

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

  // it('should perform a simple query', async () => {
  //   const client = newClient()
  //   const query = gql`
  //     {
  //       human(name: "Luke") {
  //         name
  //         height
  //       }
  //     }
  //   `

  //   const result = await client.query({ query })

  //   expect(result).toHaveProperty('data.human.name', 'Luke')
  // })
})
