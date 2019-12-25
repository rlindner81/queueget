"use strict"

const { queue } = require("../src/")
// const args = process.argv.slice(2)

// process.on("exit", (...args) => {
//   const i = 0
// })

// process.on("SIGINT", (...args) => {
//   const i = 0
// })

;(async () => {
  await queue()
})()
