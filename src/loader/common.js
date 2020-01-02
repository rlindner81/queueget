"use strict"

const stream = require("stream")
const { createWriteStream } = require("fs")
const { once } = require("events")
const { promisify } = require("util")
const { requestRaw } = require("../request")

const finished = promisify(stream.finished)

const _humanBytes = size => {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let shift = 0
  for (const [index, unit] of units.entries()) {
    if (index === units.length - 1 || size >> (shift + 10) === 0) {
      return `${(size / (1 << shift)).toFixed(1)} ${unit}`
    }
    shift += 10
  }
}

const commonload = async ({
  filename,
  url,
  requestSize = 0,
  errorStatusHandler = async () => false,
  chunkTransform = async a => a
}) => {
  console.log(`loading file ${filename}`)
  let totalLoaded = 0
  let totalLength = 0

  const fileOut = createWriteStream(filename)
  for (; ;) {
    let contentRangeFrom = 0
    let contentRangeTo = 0
    let contentLoaded = 0
    let contentLength = 0
    let dots = 0

    const response =
      requestSize > 0
        ? await requestRaw({
          url,
          headers: { range: `bytes=${totalLoaded}-${totalLoaded + requestSize - 1}` }
        })
        : await requestRaw({ url })

    if (response.statusCode >= 400) {
      if (await errorStatusHandler(response)) {
        continue
      } else {
        break
      }
    }

    const contentRangeHeader = response.headers["content-range"]
    const contentLengthHeader = response.headers["content-length"]
      ;[contentRangeFrom, contentRangeTo, totalLength] = contentRangeHeader
        ? /bytes (\d+)-(\d+)\/(\d+)/
          .exec(contentRangeHeader)
          .slice(1)
          .map(parseFloat)
        : [0, parseFloat(contentLengthHeader) - 1, parseFloat(contentLengthHeader)]
    if (contentRangeFrom === 0 && contentRangeTo + 1 === totalLength) {
      console.info(`receiving ${_humanBytes(totalLength)}`)
    } else if (Number.isFinite(contentRangeFrom) && Number.isFinite(contentRangeTo) && Number.isFinite(totalLength)) {
      console.info(
        `receiving from ${_humanBytes(contentRangeFrom + 1)} to ${_humanBytes(contentRangeTo + 1)} of ${_humanBytes(
          totalLength
        )}`
      )
    }

    contentLength = contentRangeTo - contentRangeFrom + 1

    for await (const chunk of response) {
      if (!fileOut.write(await chunkTransform(chunk))) {
        await once(fileOut, "drain")
      }
      contentLoaded += chunk.length

      if ((contentLoaded / contentLength) * 100 > dots) {
        dots++
        process.stdout.write(".")
      }
    }
    totalLoaded += contentLoaded
    process.stdout.write("\n")

    if (requestSize === 0 || contentRangeTo + 1 === totalLength) {
      break
    }
  }
  fileOut.end()
  await finished(fileOut)
}

module.exports = {
  commonload
}
