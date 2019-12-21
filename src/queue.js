"use strict"

const _url = require("url")
const newStackFile = require("./stackFile")

// TODO options => queuefile should be an option
// TODO options => parallel != 1 for parallel processing of queue

const fallback = url => {

}

const queue = async ({ filepath }) => {
  const queue = (await readFile(filepath))
    .toString()
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length !== 0)
  queue.forEach(line => {
    const url = _url.parse(line)
    let adapter = fallback
    try {
      adapter = require(`./adapter/${url.hostname}`)
    } catch (err) {
      console.warn(`warning: no custom adapter for ${url.hostname}, using fallback`)
    }
    await adapter(url)
  })
}

module.exports = queue


