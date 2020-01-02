"use strict"

const { commonload } = require("./common")
const { request } = require("../request")
const { group, sleep } = require("../helper")

const load = async (url, urlParts, queueStack, router) => {
  const firstData = (await request({ url })).data
  const adz = group(/name="adz" value="([.\d]+)"/, firstData, 1)
  const filename = group(/Filename :<\/td>[\s\S]*?<td.*?>(.+?)<\/td>/, firstData, 1)

  for (;;) {
    const secondData = (await request({ url, data: { adz } })).data
    const waitTime = group(/You must wait (\d+) minutes.../, secondData, 1)
    if (waitTime !== null) {
      if (router !== null) {
        console.info("skipping wait time by refreshing ip")
        await router.refreshIp()
      } else {
        console.info(`sleeping for ${waitTime} minutes`)
        await sleep(waitTime * 60)
      }
      continue
    }
    const realLink = group(/href="(https?:\/\/[\w-]+\.1fichier\.com\/\w+)"/, secondData, 1)
    if (realLink === null) {
      throw new Error(`could not read real link for url ${url}`)
    }
    await commonload({ filename, url: realLink })
    break
  }
}

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  load
}
