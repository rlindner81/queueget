#!/usr/bin/env node
"use strict"

const fs = require("fs")
const { promisify } = require("util")
const { spawn, execSync } = require("child_process")

const open = promisify(fs.open)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const PID_FILE = "qget.pid"
const LOG_FILE = "qget.txt"
const COMMAND = "qget"

;(async () => {
  try {
    const pid = parseFloat((await readFile(PID_FILE)).toString())
    if (!isNaN(pid)) {
      execSync(`kill ${pid}`, { stdio: "ignore" })
    }
  } catch (err) {
  }

  const foutlog = await open(LOG_FILE, "w")
  const child = spawn(COMMAND, process.argv.slice(2), { stdio: ["ignore", foutlog, foutlog], detached: true })
  await writeFile(PID_FILE, String(child.pid))
  child.unref()
})()
