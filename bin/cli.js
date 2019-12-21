"use strict"

const { queue } = require("../src/")
const filepath = "D:\\Downloads\\links_finished.txt"
// const args = process.argv.slice(2)

;(async () => {
  await queue({ filepath })
})()
