import { visit } from 'graphql/language'

const defaultConfig = {
  possibleTypes: {},
  generateAliasName: type => `__${type}__`
}

const addTypeIntrospections = (originalQuery, config) => {
  const { possibleTypes, generateAliasName } = { ...defaultConfig, ...config }
  const types = []

  const extractFragmentName = node => {
    const type = node.typeCondition.name.value

    if (!types.includes(type) && !possibleTypes[type]) {
      types.push(type)
    }
  }

  // iterate query AST and extract fragment types.
  const query = visit(originalQuery, {
    InlineFragment: { enter: extractFragmentName },
    FragmentDefinition: { enter: extractFragmentName }
  })

  const operationDefinition = query.definitions.find(
    ({ kind }) => kind === 'OperationDefinition'
  )

  for (const type of types) {
    operationDefinition.selectionSet.selections = [
      ...operationDefinition.selectionSet.selections,
      createTypeIntrospectionSelection({ type, alias: generateAliasName(type) })
    ]
  }

  return { types, query }
}

const createTypeIntrospectionSelection = ({ type, alias }) => ({
  kind: 'Field',
  alias: {
    kind: 'Name',
    value: alias
  },
  name: {
    kind: 'Name',
    value: '__type'
  },
  arguments: [
    {
      kind: 'Argument',
      name: {
        kind: 'Name',
        value: 'name'
      },
      value: {
        kind: 'StringValue',
        value: type,
        block: false
      }
    }
  ],
  selectionSet: {
    kind: 'SelectionSet',
    selections: [
      {
        kind: 'Field',
        name: {
          kind: 'Name',
          value: 'possibleTypes'
        },
        arguments: [],
        directives: [],
        selectionSet: {
          kind: 'SelectionSet',
          selections: [
            {
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'name'
              },
              arguments: [],
              directives: []
            }
          ]
        }
      }
    ]
  }
})

export { addTypeIntrospections }
