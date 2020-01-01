"use strict"

const { commonload } = require("./common")
const { request } = require("../request")
const { sleep } = require("../helper")

const _group = (regex, data) => {
  const result = regex.exec(data)
  if (result && result.length > 1) {
    return result.slice(1)
  }
  return null
}

const load = async (url, urlParts, queueStack, router) => {
  const firstData = (await request({ url })).data
  const [, adz] = /name="adz" value="([.\d]+)"/.exec(firstData)
  const [, filename] = /Filename :<\/td>[\s\S]*?<td.*?>(.+?)<\/td>/.exec(firstData)

  for (;;) {
    const secondData = (await request({ url, data: { adz } })).data
    const waitTime = _group(/You must wait (\d+) minutes.../, secondData)
    if (waitTime !== null) {
      if (router !== null) {
        console.info("skipping wait time by refreshing ip")
        router.refreshIp()
      } else {
        console.info(`sleeping for ${waitTime} minutes`)
        await sleep(waitTime * 60)
      }
      continue
    }
    const realLink = _group(/href="(https:\/\/.+\.1fichier\.com\/.+)"/, secondData)
    await commonload({ filename, url: realLink })
    break
  }
}

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  load
}
