# Apollo Progressive Fragment Matcher

[![Version](https://img.shields.io/npm/v/apollo-progressive-fragment-matcher.svg?style=flat-square)](https://www.npmjs.com/package/apollo-progressive-fragment-matcher)
[![License](https://img.shields.io/npm/l/apollo-progressive-fragment-matcher.svg)](https://github.com/lucasconstantino/apollo-progressive-fragment-matcher/blob/master/package.json)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/apollo-progressive-fragment-matcher@latest)](https://bundlephobia.com/result?p=apollo-progressive-fragment-matcher)
[![Build Status](https://travis-ci.org/lucasconstantino/apollo-progressive-fragment-matcher.svg?branch=master)](https://travis-ci.org/lucasconstantino/apollo-progressive-fragment-matcher)
[![codecov](https://codecov.io/gh/lucasconstantino/apollo-progressive-fragment-matcher/branch/master/graph/badge.svg)](https://codecov.io/gh/lucasconstantino/apollo-progressive-fragment-matcher)

**A smart alternative to the introspection fragment matcher.**

---

## Motivation

> `Error: You are using the simple (heuristic) fragment matcher...` :scream:

GraphQL APIs are evolving, and usage of Unions and Interfaces are much more common now then they use to be. Some time ago this kind of feature was considered advanced; I don't think that's true today. The GraphQL clients all need a way to distinguish data between two or more fragments that rely on inherited types (unions & interfaces), what I call the _Human and Droid_ problem.

Apollo has [long solved this issue](https://github.com/apollographql/apollo-client/pull/1483) by providing the `IntrospectionFragmentMatcher`. This fragment matcher, though, requires, that you provide a `introspectionQueryResultData`, which is your API's [introspection query](https://graphql.org/learn/introspection/) result. Introspection queries result [can be huge](https://gist.github.com/lucasconstantino/87160d2bb7ef667eb958bee38c917382).

What if we could avoid pre-fetching the introspection? What if we could _introspect as we go_?

Welcome `ProgressiveFragmentMatcher`.

## Usage

### Installation

```
npm i apollo-progressive-fragment-matcher apollo-cache-inmemory graphql invariant
```

### `ProgressiveFragmentMatcher`

The _Progressive Fragment Matcher_ has two strategies for matching fragment types:

<details>
  <summary>Progressive introspection (default)</summary>

This strategy _transforms_ the outgoing queries to request introspection information on the requesting types. It does cache the results, meaning if on a second query you use the same fragment type, it won't introspect again (nor transform the query, which can be expensive).

> This strategy is much like what ApolloClient normally does to inject \_\_typename fields.

**Good**:

- Easy to install;
- Drop-in replacement for `IntrospectionFragmentMatcher`;

**Bad**:

- Query transforms are expensive;

##### Usage

```js
import ApolloClient from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { from } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { ProgressiveFragmentMatcher } from 'apollo-progressive-fragment-matcher'

const fragmentMatcher = new ProgressiveFragmentMatcher()

const client = new ApolloClient({
  cache: new InMemoryCache({ fragmentMatcher }),
  link: from([fragmentMatcher.link(), new HttpLink()]),
})
```

</details>

<details>
  <summary>Extension based</summary>

This strategy is very performatic on the client side, because it does not depend on query transformation. What this strategy does is send the server an extension flag (`{ possibleTypes: true }`) to request the server to send possible types of any returned type in the query - regardless of the fragments requested.

> This strategy requires you have control of the server, and currently only works with ApolloServer custom extensions implementation.

**Good**:

- Fast on client;
- Persisted queries supported;

**Bad**:

- Requires server control;

##### Usage

**client:**

```js
import ApolloClient from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { from } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { ProgressiveFragmentMatcher } from 'apollo-progressive-fragment-matcher'

const fragmentMatcher = new ProgressiveFragmentMatcher({
  strategy: 'extension',
})

const client = new ApolloClient({
  cache: new InMemoryCache({ fragmentMatcher }),
  link: from([fragmentMatcher.link(), new HttpLink()]),
})
```

**server**

```js
import { ApolloServer } from 'apollo-server'
import { PossibleTypesExtension } from 'apollo-progressive-fragment-matcher'

const server = new ApolloServer({
  typeDefs,
  resolvers,
  extensions: [() => new PossibleTypesExtension()],
})

server.listen() // start server
```

</details>

> Due to a limitation on ApolloClient's customizing capabilities, both strategies require you append a link created from the fragment matcher instance.

## Warning :warning:

Although [well tested](https://codecov.io/github/lucasconstantino/apollo-progressive-fragment-matcher), this project is in an **experimental stage**.

### About persisted queries

I have not yet stressed it out on complicating circustances such as _persistend queries_. I've marked the `extension` strategy as supporting _persisted queries_ due to the nature of this operation - it relies on no query transformation, therefore _should_ be compatible with persisted queries, but no test prove this concept yet.
