"use strict"

const { randomHex, base64urlDecode } = require("../helper")
const request = require("../request")

const LINK_TYPE = {
  FILE: "#",
  FOLDER: "#F"
}

const _api = async (params = null, data = null) => {
  if (!Array.isArray(data)) {
    data = [data]
  }
  const response = await request({
    method: "POST",
    url: "https://g.api.mega.co.nz/cs",
    params,
    body: JSON.stringify(data)
  })

  return response.body
}


const get = async (linkParts, queueStack) => {
  const identifier = await randomHex(4)
  const [linkType, linkId, linkKey] = linkParts.hash.split("!")

  switch (linkType) {
    case LINK_TYPE.FILE:
      const fileId = linkId
      const fileKey = base64urlDecode(linkKey)

      const fileData = await _api(null, { a: "g", g: 1, p: fileId })
      await _getFile(fileData, fileKey)
      break
    case LINK_TYPE.FOLDER:
      const folderId = linkId
      const folderKey = base64urlDecode(linkKey)

      const folderData = await _api({ n: folderId }, { a: "f", c: 1, r: 1 })

      await Promise.all(
        folderData.f.map(async fileData => {
          if (fileData.t !== 0) {
            return
          }
          const file_key_enc = base64urlDecode(fileData.k.split(":")[1])
          const file_key = aes_ecb_decrypt(file_key_enc, folderKey)

          const node_id = fileData.h
          const node_data = await _api({ n: folderId }, { a: "g", g: 1, n: node_id })
          await _getFile(node_data, file_key)
        })
      )
      break
    default:
      throw new Error(`unknown mega link type ${linkType}`)
  }
}

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  get
}
