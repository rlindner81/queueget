"use strict"

const { parseArgs } = require("../src/args")
const { queue } = require("../src/")

// process.on("exit", (...args) => {
//   const i = 0
// })

// process.on("SIGINT", (...args) => {
//   const i = 0
// })

;(async () => {
  const options = await parseArgs(process.argv.slice(2))
  await queue(options)
})()
