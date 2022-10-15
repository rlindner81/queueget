#!/usr/bin/env node
"use strict";

const { versionText, usageText, parseArgs } = require("../src/args");
const { tryAccess } = require("../src/helper");
const { queue } = require("../src/");

(async () => {
  let options;
  try {
    options = await parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error("error:", err.message);
    return;
  }

  if (!options || options.help) {
    return console.info(usageText());
  }

  if (options.version) {
    return console.info(versionText());
  }

  const queueFile = options.restoreFile || options.queueFile;
  if (!(await tryAccess(queueFile))) {
    return console.error(`error: could not access ${queueFile}`);
  }

  await queue(options);
})();
