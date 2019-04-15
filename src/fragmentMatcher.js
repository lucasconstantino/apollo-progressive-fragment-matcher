import { visit } from 'graphql/language'
import { ApolloLink } from 'apollo-link'
import invariant from 'invariant'

import { createTypeIntrospectionSelection } from './transform'

const defaultOptions = {
  strategy: 'extension' // 'extension' | ''
}

const strategies = {
  /**
   * Uses GraphQL extensions to share possibleTypes from server to client.
   *
   * Upsides: fast.
   * Downsides: requires server contol (add extension).
   */
  extension: {
    link () {
      return new ApolloLink((operation, forward) => {
        // enable possible types fetching.
        operation.extensions.possibleTypes = true

        return forward(operation).map(result => {
          if (result.extensions && result.extensions.possibleTypes) {
            const types = result.extensions.possibleTypes

            for (let type in types) {
              if (types.hasOwnProperty(type) && !this.possibleTypesMap[type]) {
                this.possibleTypesMap[type] = types[type]
              }
            }
          }

          return result
        })
      })
    }
  },

  /**
   * Alters operations to send small and specific introespection requests.
   *
   * Upsides: easy to use.
   * Downsides: query manipulation (might be slow).
   */
  introspection: {
    link () {
      return new ApolloLink((operation, forward) => {
        const types = []

        const extractFragmentName = node => {
          if (!types.includes(node.typeCondition.name.value)) {
            types.push(node.typeCondition.name.value)
          }
        }

        // iterate query AST and extract fragment types.
        const altered = visit(operation.query, {
          InlineFragment: { enter: extractFragmentName },
          FragmentDefinition: { enter: extractFragmentName }
        })

        for (const type of types) {
          altered.definitions[0].selectionSet.selections = [
            ...altered.definitions[0].selectionSet.selections,
            createTypeIntrospectionSelection(type)
          ]
        }

        // enable possible types fetching.
        return forward({ ...operation, query: altered }).map(result => {
          if (result.extensions && result.extensions.possibleTypes) {
            const types = result.extensions.possibleTypes

            for (let type in types) {
              if (types.hasOwnProperty(type) && !this.possibleTypesMap[type]) {
                this.possibleTypesMap[type] = types[type]
              }
            }
          }

          return result
        })
      })
    }
  }
}

export class ProgressiveFragmentMatcher {
  constructor (options) {
    const { strategy: name } = { ...defaultOptions, ...options }

    if (!strategies[name]) {
      const strategyNames = Object.keys(strategies)
        .map(name => `"${name}"`)
        .join(', ')

      throw new Error(
        `ProgressiveFragmentMatcher: unknown strategy "${name}" (must be one of ${strategyNames}).`
      )
    }

    const strategy = strategies[name]

    // initiate type map.
    this.possibleTypesMap = {}
    this.match = this.match.bind(this)

    // set strategy based methods.
    this.link = strategy.link.bind(this)
  }

  ensureReady () {
    return Promise.resolve()
  }

  canBypassInit () {
    return true // we don't need to initialize this fragment matcher.
  }

  match (idValue, typeCondition, context) {
    const obj = context.store.get(idValue.id)

    if (!obj) {
      // https://github.com/apollographql/apollo-client/pull/4620
      return idValue.id === 'ROOT_QUERY'
    }

    invariant(
      obj.__typename,
      `Cannot match fragment because __typename property is missing: ${JSON.stringify(
        obj
      )}`
    )

    if (obj.__typename === typeCondition) {
      return true
    }

    const possibleTypes = this.possibleTypesMap[obj.__typename]

    if (possibleTypes && possibleTypes.indexOf(typeCondition) > -1) {
      return true
    }

    return false
  }
}
