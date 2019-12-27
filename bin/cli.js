"use strict"

const { access } = require("fs").promises
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
  try {
    await access(options.queueFile)
  } catch (err) {
    console.warn(`warning: could not access ${options.queueFile}`)
    return console.log(usage())
  }
  await queue(options)
})()
