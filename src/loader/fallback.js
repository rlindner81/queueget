"use strict"

const stream = require("stream")
const { createWriteStream } = require("fs")
const { once } = require("events")
const { promisify } = require("util")

const { requestRaw } = require("../request")
const finished = promisify(stream.finished)

const load = async (url, urlParts) => {
  const filename = urlParts.pathname
    .replace(/^\//, "")
    .replace(/\W/g, "-")
  console.log(`loading file ${filename}`)
  const response = await requestRaw({ url })
  const contentLength = parseFloat(response.headers["content-length"])
  console.log(`receiving ${contentLength} bytes`)
  let dots = 0
  let contentLoaded = 0

  const fileOut = createWriteStream(filename)
  for await (const chunk of response) {
    if (!fileOut.write(chunk)) {
      await once(fileOut, "drain")
    }
    contentLoaded += chunk.length
    if ((contentLoaded / contentLength) * 100 > dots) {
      dots++
      process.stdout.write(".")
    }
  }
  process.stdout.write("\n")
  fileOut.end()
  await finished(fileOut)
}

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  load
}
