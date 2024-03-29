"use strict";

const _url = require("url");
const newFilestack = require("./filestack");
const { sleep, readableBytes } = require("./helper");
const loaders = require("./loader");
const routers = require("./router");

const RETRY_FREQUENCY = 60;

const _getAdapter = (name, collection) =>
  Object.prototype.hasOwnProperty.call(collection, name)
    ? collection[name]
    : Object.prototype.hasOwnProperty.call(collection, "fallback")
    ? collection.fallback
    : null;

const queue = async ({
  flatten,
  queueFile = "queue.txt",
  historyFile = "queue_history.txt",
  restoreFile,
  retries = 3,
  limit,
  routername,
}) => {
  const router = _getAdapter(routername, routers);
  if (router != null) {
    console.log(`using router ${router.name}`);
  }
  if (limit !== 0) {
    console.log(`using limit ${readableBytes(limit)} per second`);
  }

  const queueStack = newFilestack(queueFile);
  if (restoreFile !== null) {
    await queueStack.restore(restoreFile);
    console.log(`restored queue ${restoreFile}`);
  }
  console.log(`loading queue ${queueFile} (${await queueStack.size()})`);

  const historyStack = newFilestack(historyFile);
  console.log(`saving history ${historyFile}`);

  for (;;) {
    const entry = await queueStack.peek();
    if (entry === null) {
      break;
    }
    const base64Match = /^[A-Za-z0-9+/]+={0,3}$/.exec(entry);
    if (base64Match !== null) {
      await queueStack.pop();
      await queueStack.pushTop(Buffer.from(entry, "base64").toString());
      continue;
    }

    const urlMatch = /^https?:\/\/\S+/.exec(entry);
    if (urlMatch === null) {
      await queueStack.pop();
      continue;
    }
    const [url] = urlMatch;
    const urlParts = _url.parse(url);
    const { hostname } = urlParts;
    let filenames = null;
    for (let retry = 1; ; ) {
      try {
        const loader = _getAdapter(hostname, loaders);
        console.info(`using hoster ${loader.name} for ${url}`);
        filenames = await loader.load(url, urlParts, { flatten, queueStack, limit, router });
        break;
      } catch (err) {
        console.error(err.stack || err.message);
        if (++retry <= retries) {
          console.warn(`waiting ${RETRY_FREQUENCY}sec for try ${retry} of ${retries}`);
          await sleep(RETRY_FREQUENCY);
        } else {
          break;
        }
      }
    }
    await queueStack.pop();
    if (filenames && Array.isArray(filenames) && filenames.length > 0) {
      await historyStack.pushTop(entry, ...filenames, "");
    } else {
      await historyStack.pushTop(entry, "");
    }
  }
};

module.exports = queue;
