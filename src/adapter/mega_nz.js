"use strict"

const { base64urlDecode, aesEcbDecrypt } = require("../helper")
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

// eslint-disable-next-line no-unused-vars
const _getFile = async (data, key) => {
  // stub
}

const get = async linkParts => {
  const [linkType, linkId, linkKey] = linkParts.hash.split("!")

  switch (linkType) {
    case LINK_TYPE.FILE: {
      let fileId = linkId
      let fileKey = base64urlDecode(linkKey)
      let fileData = await _api(null, { a: "g", g: 1, p: fileId })
      await _getFile(fileData, fileKey)
      break
    }
    case LINK_TYPE.FOLDER: {
      let folderId = linkId
      let folderKey = base64urlDecode(linkKey)
      let folderData = await _api({ n: folderId }, { a: "f", c: 1, r: 1 })
      await Promise.all(
        folderData.f.map(async fileData => {
          if (fileData.t !== 0) {
            return
          }
          let fileKey = fileData.k.split(":")[1]
          fileKey = base64urlDecode(fileKey)
          fileKey = aesEcbDecrypt(fileKey, folderKey)
          const nodeId = fileData.h
          const nodeData = await _api({ n: folderId }, { a: "g", g: 1, n: nodeId })
          await _getFile(nodeData, fileKey)
        })
      )
      break
    }
    default:
      throw new Error(`unknown mega link type ${linkType}`)
  }
}

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  get
}
