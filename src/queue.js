"use strict"

const url = require("url")
const newFileStack = require("./fileStack")
const { sleep } = require("./helper")

const RETRY_FREQUENCY = 60

// TODO options => parallel != 1 for parallel processing of queue

const _getAdapter = hostname => {
  const adapterFilePath = `./adapter/${hostname.replace(/\W/g, "_")}`
  try {
    return require(adapterFilePath)
  } catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
      return require(`./adapter/_fallback`)
    }
    throw err
  }
}

const queue = async (queueFile = "queue.txt", finishedFile = "queue_finished.txt", retries = 5) => {
  const queueStack = newFileStack(queueFile)
  const finishedStack = newFileStack(finishedFile)

  for (;;) {
    const entry = await queueStack.peek()
    if (entry === null) {
      break
    }
    const match = /^(?:(\w+)\s+)?(https?:\/\/.+)$/.exec(entry)
    if (match === null) {
      await queueStack.pop()
      continue
    }
    const [, , link] = match
    const linkParts = url.parse(link)
    for (let retry = 1; retry <= retries; retry++) {
      try {
        const adapter = _getAdapter(linkParts.hostname)
        console.info(`using adapter ${adapter.name} for ${link}`)
        await adapter.get(linkParts, queueStack)
        await queueStack.pop()
        await finishedStack.push(entry)
        break
      } catch (err) {
        console.debug(err.stack || err.message)
        console.warn(`waiting ${RETRY_FREQUENCY}sec to retry`)
        await sleep(RETRY_FREQUENCY)
      }
      console.log(`try #${retry}`)
    }
  }
}

module.exports = queue
