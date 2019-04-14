# Apollo Progressive Fragment Matcher

[![npm version](https://img.shields.io/npm/v/node-contrib-boilerplate.svg?style=flat-square)](https://www.npmjs.com/package/node-contrib-boilerplate)
[![Downloads/week](https://img.shields.io/npm/dw/node-contrib-boilerplate.svg)](https://npmjs.org/package/node-contrib-boilerplate)
[![License](https://img.shields.io/npm/l/node-contrib-boilerplate.svg)](https://github.com/lucasconstantino/node-contrib-boilerplate/blob/master/package.json)
[![build status](https://img.shields.io/travis/lucasconstantino/node-contrib-boilerplate/master.svg?style=flat-square)](https://travis-ci.org/lucasconstantino/node-contrib-boilerplate)
[![coverage](https://img.shields.io/codecov/c/github/lucasconstantino/node-contrib-boilerplate.svg?style=flat-square)](https://codecov.io/github/lucasconstantino/node-contrib-boilerplate)

**A smart alternative to the introspection fragment matcher.**

---

## Motivation

> `Error: You are using the simple (heuristic) fragment matcher...` :scream:

GraphQL APIs are evolving, and usage of Unions and Interfaces are much more common now then they use to be. Some time ago this kind of feature was considered advanced; I don't think that's true today. The GraphQL clients all need a way to distinguish data between two or more fragments that rely on inherited types (unions & interfaces), what I call the _Human and Droid_ problem.

Apollo has [long solved this issue](https://github.com/apollographql/apollo-client/pull/1483) by providing the `IntrospectionFragmentMatcher`. This fragment matcher, though, requires, that you provide a `introspectionQueryResultData`, which is your API's [introspection query](https://graphql.org/learn/introspection/) result. Introspection queries result [can be huge](https://gist.github.com/lucasconstantino/87160d2bb7ef667eb958bee38c917382).

What if we could avoid pre-fetching the introspection? What if we could _introspect as we go_?

Welcome `ProgressiveFragmentMatcher`.

## Usage

### Requirements

This project uses the concept of [GraphQL extensions](https://graphql.github.io/graphql-spec/June2018/#sec-Response-Format) to append data to a response. This means you _must_ be able to control the GraphQL server, besides the Apollo Client.

### Installation

```
npm i apollo-progressive-fragment-matcher
```

### Usage

#### Server

```js
// sample usage...
```

#### Client

```js
// sample usage...
```
