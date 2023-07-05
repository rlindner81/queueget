#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const { spawn, execSync } = require("child_process");

const open = promisify(fs.open);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const PID_FILE = "queueget.pid";
const LOG_FILE = "queueget.txt";
const SCRIPT = path.join(__dirname, "cli.js");

const _kill = (pid) => {
  if (Number.isFinite(pid)) {
    const killCommand = process.platform === "win32" ? `taskkill /f /pid ${pid}` : `kill ${pid}`;
    execSync(killCommand, { stdio: "ignore" });
  }
};

(async () => {
  const [command] = process.argv.slice(2);
  try {
    const pid = parseFloat((await readFile(PID_FILE)).toString());
    _kill(pid);
    // eslint-disable-next-line no-empty
  } catch (err) {}
  if (/stop|kill/gi.test(command)) {
    console.log("stopping queuegetd");
    process.exit(0);
  }

  const foutlog = await open(LOG_FILE, "w");
  const child = spawn(process.execPath, [SCRIPT].concat(process.argv.slice(2)), {
    stdio: ["ignore", foutlog, foutlog],
    detached: true,
  });
  await writeFile(PID_FILE, String(child.pid));
  child.unref();
})();
