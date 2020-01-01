"use strict"

const { commonload } = require("./common")
const { request } = require("../request")

const load = async url => {
  const firstData = (await request({ url })).data
  const [, adz] = /name="adz" value="([.\d]+)"/.exec(firstData)
  const [, filename] = /Filename :<\/td>[\s\S]*?<td.*?>(.+?)<\/td>/.exec(firstData)

  const secondData = (await request({ url, data: { adz } })).data
  const [realLink] = /href="https:\/\/[\w-]+\.1fichier\.com\/\w+"/.exec(secondData)
  await commonload({ filename, url: realLink })
}

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  load
}
