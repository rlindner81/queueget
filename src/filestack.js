"use strict";

const fs = require("fs");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);

const newFilestack = (filepath) => {
  const flush = async (lines) => {
    try {
      await writeFile(filepath, lines.join("\n"));
    } catch (err) {
      console.error(`could not write filepath ${filepath}: ${err.message}`);
    }
  };

  const unflush = async () => {
    try {
      const data = (await readFile(filepath)).toString();
      return data.length === 0 ? [] : data.split("\n").map((line) => line.trim());
    } catch (err) {
      if (err.code !== "ENOENT") {
        throw err;
      }
      return [];
    }
  };

  const push = async (index = 0, ...values) => {
    const lines = await unflush();
    lines.splice(index, 0, ...values);
    return flush(lines);
  };
  const pushTop = async (...values) => {
    const lines = await unflush();
    return flush(values.concat(lines));
  };
  const pushBottom = async (...values) => {
    const lines = await unflush();
    return flush(lines.concat(values));
  };

  const pop = async (index = 0) => {
    const lines = await unflush();
    if (lines.length === 0) {
      return null;
    }

    const [value] = lines.splice(index, 1);
    await flush(lines);
    return value;
  };

  const peek = async (index = 0) => {
    const lines = await unflush();
    if (lines.length === 0) {
      return null;
    }
    const [value] = lines.splice(index, 1);
    return value;
  };

  const size = async () => {
    const lines = await unflush();
    return lines.length;
  };

  const backup = async (backupFilepath) => {
    try {
      await copyFile(filepath, backupFilepath);
    } catch (err) {
      console.warn(`could not copy filepath ${filepath} to backup ${backupFilepath}: ${err.message}`);
    }
  };

  const restore = async (restoreFile) => {
    try {
      await copyFile(restoreFile, filepath);
    } catch (err) {
      console.warn(`could not restore backup ${restoreFile} to filepath ${filepath}: ${err.message}`);
    }
  };

  return {
    flush,
    unflush,
    push,
    pushTop,
    pushBottom,
    pop,
    peek,
    size,
    backup,
    restore,
  };
};

module.exports = newFilestack;
