## Fabric JS Core

This package contains shared business logic between our Fabric JS implementations: [Web Components](https://github.com/fabric-ds/elements), [React](https://github.com/fabric-ds/react) and [Vue](https://github.com/fabric-ds/vue).

### Goals

The aim of this package is to centralise logic that would otherwise be duplicated across our JavaScript library implementations. We wish to keep this package as raw JS as possible, while allowing for the libraries themselves to dictate the input and output types of certain functions, for example DOM operations.
