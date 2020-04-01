"use strict"

const { commonload } = require("./common")

const load = (url, urlParts) => {
  const filename = urlParts.pathname.replace(/^\//, "").replace(/[^.\w]/g, "-")
  return commonload({ filename, url })
}

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  load,
}
