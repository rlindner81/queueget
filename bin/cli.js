#!/usr/bin/env node
"use strict"

const fs = require("fs")
const { promisify } = require("util")
const { versionText, usageText, parseArgs } = require("../src/args")
const { queue } = require("../src/")

const access = promisify(fs.access)

;(async () => {
  let options
  try {
    options = await parseArgs(process.argv.slice(2))
  } catch (err) {
    console.error("error:", err.message)
    return
  }

  if (!options || options.help) {
    return console.info(usageText())
  }

  if (options.version) {
    return console.info(versionText())
  }

  try {
    await access(options.queueFile)
  } catch (err) {
    return console.error(`error: could not access ${options.queueFile}`)
  }
  await queue(options)
})()
