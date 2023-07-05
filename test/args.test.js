"use strict";

const { readFileSync } = require("fs");
const { join } = require("path");
const { usageText } = require("../src/args");

test("usage log", () => {
  const readme = readFileSync(join(__dirname, "..", "README.md")).toString();
  const syntaxRe = /## Usage\n\n```([\w\W]*?)\n```/;
  const usageDoc = syntaxRe.exec(readme)[1].replace(/usage: queueget/g, "usage: jest");
  const usageLog = usageText();
  expect(usageLog).toEqual(usageDoc);
});
