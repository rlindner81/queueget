"use strict"

const { commonload } = require("./common")
const { sleep, base64urlDecode, decrypt, aesEcbDecipher, aesCbcDecipher, aesCtrDecipher } = require("../helper")
const { request } = require("../request")

const LINK_TYPE = {
  FILE: "#",
  FOLDER: "#F",
}

// http://julien-marchand.fr/blog/using-mega-api-with-python-examples/
// h: The ID of the node
// p: The ID of the parent node (directory)
// u: The owner of the node
// t: The type of the node
//   0: File
//   1: Directory
//   2: Special node: Root (Cloud Drive)
//   3: Special node: Inbox
//   4: Special node: Trash Bin
// a: The attributes of the node. Currently only contains its name
// k: The key of the node (used to encrypt its content and its attributes)
// s: The size of the node
// ts: The time of the last modification of the node

const _foldKey = (key) => {
  let result = Buffer.alloc(16, 0)
  Buffer.from(key).forEach((c, i) => {
    result[i % 16] ^= c
  })
  return result
}

const _api = async (query = null, data = null) => {
  if (!Array.isArray(data)) {
    data = [data]
  }
  const response = await request({ method: "POST", url: "https://g.api.mega.co.nz/cs", query, data })
  const result = Array.isArray(response.data) && response.data.length === 1 ? response.data[0] : response.data
  if (typeof result === "number" && result < 0) {
    throw new Error("file does not exist")
  }
  return result
}

const _decryptAttributes = (attributes, key) => {
  attributes = base64urlDecode(attributes)
  attributes = decrypt(aesCbcDecipher(_foldKey(key)), attributes)
  attributes = attributes.toString()
  if (attributes.slice(0, 4) !== "MEGA") {
    throw new Error("failed attribute decryption")
  }
  attributes = JSON.parse(attributes.slice(4).replace(/}.*?$/, "}"))
  return attributes
}

const load = async (url, urlParts, queueStack, router) => {
  const _downloadAndDecrypt = (link, filename, key) => {
    const iv = Buffer.concat([key.slice(16, 24), Buffer.alloc(8, 0)])
    const decipher = aesCtrDecipher(_foldKey(key), iv)
    const requestSize = 500000000 // 0.5GB
    return commonload({
      filename,
      url: link,
      requestSize,
      errorStatusHandler: async (response) => {
        if (response.statusCode === 509) {
          if (router) {
            console.info("bandwidth limit exceeded refreshing ip")
            await router.refreshIp()
          } else {
            const timeLeft = parseFloat(response.headers["x-mega-time-left"])
            console.info(`bandwidth limit exceeded sleeping ${timeLeft}sec`)
            await sleep(timeLeft)
          }
          return true
        }
      },
      chunkTransform: (chunk) => decipher.update(chunk),
    })
  }

  const _getFile = (data, key) => {
    const link = data.g
    const attributes = _decryptAttributes(data.at, key)
    const filename = attributes.n
    return _downloadAndDecrypt(link, filename, key)
  }

  const { pathname: urlPathname, hash: urlHash } = urlParts
  let linkType, linkId, linkKey
  if (urlPathname === "/") {
    ;[linkType, linkId, linkKey] = urlHash.split("!")
  } else if (urlPathname.startsWith("/file/")) {
    ;[linkType, linkId, linkKey] = [LINK_TYPE.FILE, urlPathname.substring("/file/".length), urlHash.substring(1)]
  } else if (urlPathname.startsWith("/folder/")) {
    ;[linkType, linkId, linkKey] = [LINK_TYPE.FOLDER, urlPathname.substring("/folder/".length), urlHash.substring(1)]
  } else {
    throw new Error(`unknown pathname ${urlPathname}`)
  }

  switch (linkType) {
    case LINK_TYPE.FILE: {
      let fileId = linkId
      let fileKey = base64urlDecode(linkKey)
      let fileData = await _api(null, { a: "g", g: 1, p: fileId })
      return _getFile(fileData, fileKey)
    }
    case LINK_TYPE.FOLDER: {
      let folderId = linkId
      let folderKey = base64urlDecode(linkKey)
      let folderData = await _api({ n: folderId }, { a: "f", c: 1, r: 1 })
      let filenames = []
      // NOTE: I want to do these sequentially for now
      for (const fileData of folderData.f) {
        if (fileData.t !== 0) {
          continue
        }
        let fileKey = fileData.k.split(":")[1]
        fileKey = base64urlDecode(fileKey)
        fileKey = decrypt(aesEcbDecipher(_foldKey(folderKey)), fileKey)
        const nodeId = fileData.h
        const nodeData = await _api({ n: folderId }, { a: "g", g: 1, n: nodeId })
        filenames = filenames.concat(await _getFile(nodeData, fileKey))
      }
      return filenames
    }
    default:
      throw new Error(`unknown mega link type ${linkType}`)
  }
}

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  load,
}
