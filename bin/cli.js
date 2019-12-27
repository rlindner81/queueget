"use strict"

const { access } = require("fs").promises
const { usage, parseArgs } = require("../src/args")
const { queue } = require("../src/")

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
