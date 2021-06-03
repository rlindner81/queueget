"use strict"

const { commonload } = require("./common")

const load = (url, urlParts, { limit }) => {
  const filename = urlParts.pathname.replace(/^\//, "").replace(/[^.\w]/g, "-")
  return commonload({ filename, url, bytesPerSecond: limit })
}

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  load,
}
