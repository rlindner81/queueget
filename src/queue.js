"use strict"

const _url = require("url")
const newFilestack = require("./filestack")
const { sleep } = require("./helper")
const loaders = require("./loader")
const routers = require("./router")

const RETRY_FREQUENCY = 60
// TODO options => parallel != 1 for parallel processing of queue

const _getAdapter = (name, collection) =>
  Object.prototype.hasOwnProperty.call(collection, name)
    ? collection[name]
    : Object.prototype.hasOwnProperty.call(collection, "fallback")
    ? collection.fallback
    : null

const queue = async ({
  queueFile = "queue.txt",
  historyFile = "queue_history.txt",
  restoreFile = null,
  // restoreFile = "queue_backup.txt",
  retries = 3,
  routername = "fritz.box"
}) => {
  const router = _getAdapter(routername, routers)
  if (router != null) {
    console.log(`using router ${router.name}`)
  }

  const queueStack = newFilestack(queueFile)
  if (restoreFile !== null) {
    await queueStack.restore(restoreFile)
    console.log(`restored queue ${restoreFile}`)
  }
  console.log(`loading queue ${queueFile} (${await queueStack.size()})`)

  const historyStack = newFilestack(historyFile)
  console.log(`saving history ${historyFile} (${await historyStack.size()})`)

  for (;;) {
    const entry = await queueStack.peek()
    if (entry === null) {
      break
    }
    const match = /https?:\/\/\S+/.exec(entry)
    if (match === null) {
      await queueStack.pop()
      continue
    }
    const [url] = match
    const urlParts = _url.parse(url)
    const { hostname } = urlParts
    for (let retry = 1;;) {
      try {
        const loader = _getAdapter(hostname, loaders)
        console.info(`using hoster ${loader.name} for ${url}`)
        await loader.load(url, urlParts, queueStack, router)
        break
      } catch (err) {
        console.debug(err.stack || err.message)
        if (++retry <= retries) {
          console.warn(`waiting ${RETRY_FREQUENCY}sec for try ${retry} or ${retries}`)
          await sleep(RETRY_FREQUENCY)
        } else {
          break
        }
      }
    }
    await queueStack.pop()
    await historyStack.push(entry)
  }
}

module.exports = queue
