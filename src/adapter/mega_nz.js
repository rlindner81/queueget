"use strict"

const { createWriteStream } = require("fs")
const { once } = require("events")
const { base64urlDecode, decrypt, aesEcbDecipher, aesCbcDecipher, aesCtrDecipher } = require("../helper")
const { request, requestRaw } = require("../request")

const LINK_TYPE = {
  FILE: "#",
  FOLDER: "#F"
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

const _refreshIp = async () => {
  const i = 0
  // stub
}

const _foldKey = key => {
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
  return Array.isArray(response.data) && response.data.length === 1 ? response.data[0] : response.data
}

const _decryptAttributes = (attributes, key) => {
  attributes = base64urlDecode(attributes)
  attributes = decrypt(aesCbcDecipher(_foldKey(key)), attributes)
  attributes = attributes.toString()
  if (attributes.slice(0, 4) !== "MEGA") {
    throw new Error("wrong attribute decryption")
  }
  attributes = JSON.parse(attributes.slice(4).replace(/}.*?$/, "}"))
  return attributes
}

const _downloadAndDecrypt = async (link, filename, key) => {
  const iv = Buffer.concat([key.slice(16, 24), Buffer.alloc(8, 0)])
  key = _foldKey(key)
  const decipher = aesCtrDecipher(key, iv)
  const requestSizeLimit = 500000000 // 0.5GB
  let totalLoaded = 0

  const fileOut = createWriteStream(filename)
  for (; ;) {
    const response = await requestRaw({
      url: link,
      headers: { Range: `bytes=${totalLoaded}-${totalLoaded + requestSizeLimit - 1}` }
    })

    if (response.statusCode === 509) {
      await _refreshIp()
      continue
    }

    const [,contentRangeFrom, contentRangeTo, totalLength] = /bytes (\d+)-(\d+)\/(\d+)/.exec(response.headers["content-range"])
    const contentLength = parseInt(response.headers["content-length"])
    let contentLoaded = 0
    let dots = 0

    for await (const chunk of response) {
      const decrypted = decipher.update(chunk)
      if (!fileOut.write(decrypted)) {
        await once(fileOut, "drain") // Handle backpressure
      }
      contentLoaded += decrypted.length

      if (contentLoaded / contentLength * 100 > dots) {
        dots++
        process.stdout.write(".")
      }
    }
    totalLoaded += contentLoaded
    process.stdout.write("\n")

    if (contentRangeTo === totalLength) {
      fileOut.write(decipher.final())
      fileOut.end()
      break
    }
  }
}

const _getFile = async (data, key) => {
  const link = data.g
  const attributes = _decryptAttributes(data.at, key)
  const filename = attributes.n
  console.log(`downloading file: ${filename}`)
  await _downloadAndDecrypt(link, filename, key)
}

const get = async linkParts => {
  const [linkType, linkId, linkKey] = linkParts.hash.split("!")

  switch (linkType) {
    case LINK_TYPE.FILE: {
      let fileId = linkId
      let fileKey = base64urlDecode(linkKey)
      let fileData = await _api(null, { a: "g", g: 1, p: fileId })
      return await _getFile(fileData, fileKey)
    }
    case LINK_TYPE.FOLDER: {
      let folderId = linkId
      let folderKey = base64urlDecode(linkKey)
      let folderData = await _api({ n: folderId }, { a: "f", c: 1, r: 1 })
      return await Promise.all(
        folderData.f.map(async fileData => {
          if (fileData.t !== 0) {
            return
          }
          let fileKey = fileData.k.split(":")[1]
          fileKey = base64urlDecode(fileKey)
          fileKey = decrypt(aesEcbDecipher(fileKey), folderKey)
          const nodeId = fileData.h
          const nodeData = await _api({ n: folderId }, { a: "g", g: 1, n: nodeId })
          await _getFile(nodeData, fileKey)
        })
      )
    }
    default:
      throw new Error(`unknown mega link type ${linkType}`)
  }
}

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  get
}
