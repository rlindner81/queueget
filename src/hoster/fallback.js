"use strict"
/*eslint no-unused-vars: off*/

const newLoader = (queueStack, router) => {
  const load = async (url, urlParts) => {
    // stub
  }
  return { load }
}

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  newLoader
}
