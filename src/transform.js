const createTypeIntrospectionSelection = name => ({
  kind: 'Field',
  alias: {
    kind: 'Name',
    value: `__${name}__`
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
        value: name,
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

export { createTypeIntrospectionSelection }
