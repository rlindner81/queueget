#!/usr/bin/env node
"use strict";

const { versionText, usageText, parseArgs } = require("../src/args");
const queue = require("../src/queue");

(async () => {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
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

  await queue(options);
})();
