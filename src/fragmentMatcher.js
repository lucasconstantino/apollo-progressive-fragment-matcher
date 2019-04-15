import { ApolloLink } from 'apollo-link'
import invariant from 'invariant'

export class ProgressiveFragmentMatcher {
  constructor () {
    // initiate type map.
    this.possibleTypesMap = {}

    // necessary bindings.
    this.match = this.match.bind(this)
  }

  link () {
    return new ApolloLink((operation, forward) =>
      forward(operation).map(result => {
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
    )
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

    const implementingTypes = this.possibleTypesMap[obj.__typename]
    if (implementingTypes && implementingTypes.indexOf(typeCondition) > -1) {
      return true
    }

    return false
  }
}
