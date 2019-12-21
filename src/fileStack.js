"use strict"

const { readFile, writeFile, copyFile } = require("fs").promises

const newFileStack = filepath => {
  const flush = async lines => {
    try {
      await writeFile(filepath, lines.join("\n"))
    } catch (err) {
      console.error(`could not write filepath ${filepath}: ${err.message}`)
    }
  }

  const unflush = async () => {
    try {
      const data = (await readFile(filepath)).toString()
      return data
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0)
    } catch (err) {
      console.warning(`could not read filepath ${filepath}: ${err.message}`)
      return []
    }
  }

  const push = async (value, index = 0) => {
    const lines = await unflush()
    lines.splice(index, 0, value)
    await flush(lines)
  }

  const pop = async () => {
    const lines = await unflush()
    if (lines.length === 0) {
      return null
    }
    const value = lines.pop()
    await flush(lines)
    return value
  }

  const peek = async () => {
    const lines = await unflush()
    if (lines.length === 0) {
      return null
    }
    return lines.pop()
  }

  const backup = async backupFilepath => {
    try {
      await copyFile(filepath, backupFilepath)
    } catch (err) {
      console.warning(`could not copy filepath ${filepath} to backup ${backupFilepath}: ${err.message}`)
    }
  }

  const restore = async backupFilepath => {
    try {
      await copyFile(backupFilepath, filepath)
    } catch (err) {
      console.warning(`could not restore backup ${backupFilepath} to filepath ${filepath}: ${err.message}`)
    }
  }

  return {
    flush,
    unflush,
    push,
    pop,
    peek,
    backup,
    restore
  }
}

module.exports = newFileStack
