"use strict"

const { readFileSync } = require("fs")
const { join } = require("path")
const { usageText } = require("../src/args")

test("usagelog", () => {
  const readme = readFileSync(join(__dirname, "..", "README.md")).toString()
  const syntaxRe = /## Usage\n\n```([\w\W]*?)\n```/
  const usageDoc = syntaxRe.exec(readme)[1]
  const usageLog = usageText()
  expect(usageLog).toEqual(usageDoc)
})
