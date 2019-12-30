#!/usr/bin/env node
"use strict"

const fs = require("fs")
const { promisify } = require("util")
const { usage, parseArgs } = require("../src/args")
const { queue } = require("../src/")

const access = promisify(fs.access)

;(async () => {
  const options = await parseArgs(process.argv.slice(2))
  if (options.help) {
    return console.info(usage())
  }
  try {
    await access(options.queueFile)
  } catch (err) {
    console.warn(`warning: could not access ${options.queueFile}`)
    return console.info(usage())
  }
  await queue(options)
})()
