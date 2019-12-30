#!/usr/bin/env node
"use strict"

const fs = require("fs")
const path = require("path")
const { promisify } = require("util")
const { spawn, execSync } = require("child_process")

const open = promisify(fs.open)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const PID_FILE = "qget.pid"
const LOG_FILE = "qget.txt"
const SCRIPT = path.join(__dirname, "cli.js")

const _kill = pid => {
  if (Number.isFinite(pid)) {
    const killCommand = process.platform === "win32" ? `taskkill /pid ${pid}` : `kill ${pid}`
    execSync(killCommand, { stdio: "ignore" })
  }
}

;(async () => {
  try {
    const pid = parseFloat((await readFile(PID_FILE)).toString())
    _kill(pid)
    // eslint-disable-next-line no-empty
  } catch (err) {}

  const foutlog = await open(LOG_FILE, "w")
  let options = {
    stdio: ["ignore", foutlog, foutlog],
    detached: true
  }
  const child = spawn(process.execPath, [SCRIPT].concat(process.argv.slice(2)), options)
  await writeFile(PID_FILE, String(child.pid))
  child.unref()
})()
