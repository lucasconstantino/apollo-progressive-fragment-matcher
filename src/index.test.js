import {
  ProgressiveFragmentMatcher,
  PossibleTypesExtension,
  addTypeIntrospections
} from './'

describe('apollo-progressive-fragment-matcher', () => {
  it('should export APIs', () => {
    expect(ProgressiveFragmentMatcher).toBeDefined()
    expect(PossibleTypesExtension).toBeDefined()
    expect(addTypeIntrospections).toBeDefined()
  })
})
