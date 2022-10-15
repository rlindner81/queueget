"use strict";

const stream = require("stream");
const fs = require("fs");
const { dirname } = require("path");
const { once } = require("events");
const { promisify } = require("util");
const { requestRaw } = require("../request");
const { readableBytes, cursorBackward, cursorForward, tryAccess } = require("../helper");

const finished = promisify(stream.finished);
const fsRenameAsync = promisify(fs.rename);
const fsMkdirAsync = promisify(fs.mkdir);
const sleep = promisify(setTimeout);

const PARTIAL_SUFFIX = ".partial";
const MAX_DOTS = 100;

const commonload = async ({
  filepath,
  url,
  requestSize = 0,
  bytesPerSecond = 0,
  errorStatusHandler = async (response) => {
    throw new Error(`bad response ${response.statusCode} (${response.statusMessage})`);
  },
  chunkTransform,
}) => {
  const filedir = dirname(filepath);
  if (filedir && !(await tryAccess(filedir))) {
    await fsMkdirAsync(filedir, { recursive: true });
  }
  if (await tryAccess(filepath)) {
    console.log(`file exists ${filepath}`);
    return [filepath];
  }
  console.log(`loading file ${filepath}`);

  let totalLoaded = 0;
  let totalLength = 0;

  chunkTransform && chunkTransform.initialize();
  const filepathPartial = `${filepath}${PARTIAL_SUFFIX}`;
  const partialExists = await tryAccess(filepathPartial);

  if (partialExists) {
    const fileIn = fs.createReadStream(filepathPartial);
    for await (const chunk of fileIn) {
      chunkTransform && (await chunkTransform.update(chunk));
      totalLoaded += chunk.length;
    }
    fileIn.destroy();
  }

  const fileOut = fs.createWriteStream(filepathPartial, { flags: "a", start: totalLoaded });
  for (;;) {
    const contentLoadStartTime = Date.now();
    let contentLoadElapsedTime = 0;
    let contentRangeFrom = 0;
    let contentRangeTo = 0;
    let contentLoaded = 0;
    let contentLength = 0;
    let dots = 0;

    const response =
      requestSize > 0
        ? await requestRaw({
            url,
            headers: { range: `bytes=${totalLoaded}-${totalLoaded + requestSize - 1}` },
          })
        : await requestRaw({ url });

    if (response.statusCode >= 400) {
      if (await errorStatusHandler(response)) {
        continue;
      } else {
        break;
      }
    }

    const contentRangeHeader = response.headers["content-range"];
    const contentLengthHeader = response.headers["content-length"];
    [contentRangeFrom, contentRangeTo, totalLength] = contentRangeHeader
      ? /bytes (\d+)-(\d+)\/(\d+)/.exec(contentRangeHeader).slice(1).map(parseFloat)
      : [0, parseFloat(contentLengthHeader) - 1, parseFloat(contentLengthHeader)];
    if (contentRangeFrom === 0 && contentRangeTo + 1 === totalLength) {
      console.info(`receiving ${readableBytes(totalLength)}`);
    } else if (Number.isFinite(contentRangeFrom) && Number.isFinite(contentRangeTo) && Number.isFinite(totalLength)) {
      console.info(
        `receiving from ${readableBytes(contentRangeFrom)} to ${readableBytes(contentRangeTo + 1)} of ${readableBytes(
          totalLength
        )}`
      );
    }

    contentLength = contentRangeTo - contentRangeFrom + 1;

    // Prepare dots
    process.stdout.write("[");
    cursorForward(MAX_DOTS);
    process.stdout.write("]");
    cursorBackward(MAX_DOTS + 1);

    for await (const chunk of response) {
      if (!fileOut.write(chunkTransform ? chunkTransform.update(chunk) : chunk)) {
        await once(fileOut, "drain");
      }
      contentLoaded += chunk.length;

      // Console update
      const contentLoadedDots = (contentLoaded / contentLength) * MAX_DOTS;
      while (contentLoadedDots > dots) {
        dots++;
        process.stdout.write(".");
      }

      // Throttling
      contentLoadElapsedTime = Date.now() - contentLoadStartTime;
      let sleeptime = bytesPerSecond === 0 ? 0 : (contentLoaded / bytesPerSecond) * 1000 - contentLoadElapsedTime;
      if (sleeptime > 0) {
        await sleep(sleeptime);
      }
    }
    totalLoaded += contentLoaded;
    process.stdout.write("\n");

    if (requestSize === 0 || contentRangeTo + 1 === totalLength) {
      break;
    }
  }
  chunkTransform && fileOut.write(chunkTransform.finalize());
  fileOut.end();
  await finished(fileOut);

  await fsRenameAsync(filepathPartial, filepath);
  return [filepath];
};

module.exports = {
  commonload,
};
