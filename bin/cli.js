"use strict"

const { usage, parseArgs } = require("../src/args")
const { queue } = require("../src/")

// process.on("exit", (...args) => {
//   const i = 0
// })

// process.on("SIGINT", (...args) => {
//   const i = 0
// })

;(async () => {
  const options = await parseArgs(process.argv.slice(2))
  if (options.help) {
    return console.log(usage())
  }
  await queue(options)
})()
