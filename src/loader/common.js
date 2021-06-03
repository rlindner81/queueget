"use strict"

const stream = require("stream")
const fs = require("fs")
const { once } = require("events")
const { promisify } = require("util")
const { requestRaw } = require("../request")

const finished = promisify(stream.finished)
const fsAccessAsync = promisify(fs.access)
const fsRenameAsync = promisify(fs.rename)
const sleep = promisify(setTimeout)

const PARTIAL_SUFFIX = ".partial"

const _existsAsync = async (filename) => {
  try {
    await fsAccessAsync(filename)
    return true
  } catch (err) {
    if (err.code === "ENOENT") {
      return false
    } else throw err
  }
}

const _humanBytes = (size) => {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let current = 1
  let next = 1024
  for (let index = 0; index < units.length; index++) {
    if (index === units.length - 1 || size < next) {
      return `${(size / current).toFixed(1)} ${units[index]}`
    }
    current = next
    next *= 1024
  }
}

const commonload = async ({
  filename,
  url,
  requestSize = 0,
  bytesPerSecond = 0,
  errorStatusHandler = async (response) => {
    throw new Error(`bad response ${response.statusCode} (${response.statusMessage})`)
  },
  chunkTransform = async (a) => a,
}) => {
  if (await _existsAsync(filename)) {
    console.log(`file exists ${filename}`)
    return
  }
  console.log(`loading file ${filename}`)

  let totalLoaded = 0
  let totalLength = 0

  const filenamePartial = `${filename}${PARTIAL_SUFFIX}`
  const partialExists = await _existsAsync(filenamePartial)

  if (partialExists) {
    const fileIn = fs.createReadStream(filenamePartial)
    for await (const chunk of fileIn) {
      await chunkTransform(chunk)
      totalLoaded += chunk.length
    }
    fileIn.destroy()
  }

  const fileOut = fs.createWriteStream(filenamePartial, { flags: "a", start: totalLoaded })
  for (;;) {
    const contentLoadStartTime = Date.now()
    let contentLoadElapsedTime = 0
    let contentRangeFrom = 0
    let contentRangeTo = 0
    let contentLoaded = 0
    let contentLength = 0
    let dots = 0

    const response =
      requestSize > 0
        ? await requestRaw({
            url,
            headers: { range: `bytes=${totalLoaded}-${totalLoaded + requestSize - 1}` },
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
      ? /bytes (\d+)-(\d+)\/(\d+)/.exec(contentRangeHeader).slice(1).map(parseFloat)
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

      // Console update
      if ((contentLoaded / contentLength) * 100 > dots) {
        dots++
        process.stdout.write(".")
      }

      // Throttling
      contentLoadElapsedTime = Date.now() - contentLoadStartTime
      let sleeptime = bytesPerSecond === 0 ? 0 : (contentLoaded / bytesPerSecond) * 1000 - contentLoadElapsedTime
      if (sleeptime > 0) {
        await sleep(sleeptime)
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

  await fsRenameAsync(filenamePartial, filename)
  return [filename]
}

module.exports = {
  commonload,
}
