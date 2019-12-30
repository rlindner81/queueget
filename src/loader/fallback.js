"use strict"

const { commonload } = require("./common")

const load = async (url, urlParts) => {
  const filename = urlParts.pathname.replace(/^\//, "").replace(/[^.\w]/g, "-")
  await commonload({ filename, url })
}

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  load
}
