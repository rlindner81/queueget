"use strict"

const stream = require("stream")
const { createWriteStream } = require("fs")
const { once } = require("events")
const { promisify } = require("util")
const { requestRaw } = require("../request")

const finished = promisify(stream.finished)

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
  for (;;) {
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
      : contentLengthHeader
      ? [0, parseFloat(contentLengthHeader) - 1, parseFloat(contentLengthHeader)]
      : [0, 0, 1]
    if (contentRangeFrom === 0 && contentRangeTo + 1 === totalLength) {
      console.info(`receiving ${totalLength} bytes`)
    } else {
      console.info(`receiving from ${contentRangeFrom + 1} to ${contentRangeTo + 1} of ${totalLength} bytes`)
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

    if (contentRangeTo + 1 === totalLength) {
      break
    }
  }
  fileOut.end()
  await finished(fileOut)
}

module.exports = {
  commonload
}
