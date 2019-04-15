const unique = (item, index, array) => array.indexOf(item) === index

export class PossibleTypesExtension {
  constructor () {
    this.enabled = false
    this.schema = null
  }

  requestDidStart ({ extensions: { possibleTypes } = {}, ...rest }) {
    this.enabled = !!possibleTypes
  }

  willResolveField (root, args, context, { schema }) {
    this.schema = schema
  }

  willSendResponse ({ graphqlResponse, context }) {
    if (this.enabled && this.schema) {
      const types = this.extractTypes(graphqlResponse.data).filter(unique)
      const possibleTypes = {}

      for (let type of types) {
        possibleTypes[type] = this.schema
          .getType(type)
          .getInterfaces()
          .map(({ name }) => name)
      }

      graphqlResponse.extensions = graphqlResponse.extensions || {}
      graphqlResponse.extensions.possibleTypes = possibleTypes
    }

    return { graphqlResponse, context }
  }

  extractTypes (obj) {
    const types = []

    if (!obj) return types

    for (let field of Object.keys(obj)) {
      if (field === '__typename') types.push(obj[field])

      if (typeof obj[field] === 'object') {
        types.push(...this.extractTypes(obj[field]))
      }
    }

    return types
  }
}
