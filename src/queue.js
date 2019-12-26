"use strict"

const _url = require("url")
const newFilestack = require("./filestack")
const { sleep } = require("./helper")
const hosters = require("./hoster")
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
  finishedFile = "queue_finished.txt",
  retries = 5,
  routername = "fritz.box"
}) => {
  const queueStack = newFilestack(queueFile)
  const finishedStack = newFilestack(finishedFile)
  const router = _getAdapter(routername, routers)

  console.log(`using queue ${queueFile}`)
  console.log(`using router ${router.name}`)
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
    for (let retry = 1; retry <= retries; retry++) {
      try {
        const hoster = _getAdapter(hostname, hosters)
        console.info(`using hoster ${hoster.name} for ${url}`)
        await hoster.newLoader(queueStack, router).load(url, urlParts)
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
