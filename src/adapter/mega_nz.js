"use strict"

const { createWriteStream } = require("fs")
const { base64urlDecode, decrypt, aesEcbDecipher, aesCbcDecipher, aesCtrDecipher } = require("../helper")
const request = require("../request")

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

const _foldKey = key => {
  let result = Buffer.alloc(16, 0)
  Buffer.from(key).forEach((c, i) => {
    result[i % 16] ^= c
  })
  return result
}


const _api = async (params = null, data = null) => {
  if (!Array.isArray(data)) {
    data = [data]
  }
  const response = await request("POST", "https://g.api.mega.co.nz/cs", params, data)
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
  const sizeLimit = 500000000 // 0.5GB
  let totalLoaded = 0

  const fileOut = createWriteStream(filename)
  for (; ;) {
    const response = await request("GET", link, null, null, { Range: `bytes=${totalLoaded}-${totalLoaded + sizeLimit - 1}` }, resData => {
      const decrypted = decipher.update(resData)
      let drain = !fileOut.write(decrypted)
    })
    const i = 0
  }

  /*
      iv = key[16:24] + '\0' * 8
    key = fold_key(key)
    log.debug("using enc_key: {}, enc_iv: {}".format(key.encode("hex"), iv.encode("hex")))

    counter = Counter.new(128, initial_value=int(iv.encode('hex'), 16))
    aes = AES.new(key, AES.MODE_CTR, counter=counter)
    # WIP: try to deal with 104 connection reset by peer problem by decreasing overall size_limit.
    # size_limit = 5000000000
    size_limit = 500000000
    total_loaded = 0

    with open(filename, 'wb') as fout:
        while True:
            response = requests.get(url, stream=True, headers={"Range": "bytes={}-{}".format(total_loaded, total_loaded + size_limit - 1)})
            if response.status_code == 509:
                refresh_ip()
                continue

            content_length = int(response.headers["content-length"])
            content_loaded = 0
            dots = 0
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:  # filter out keep-alive new chunks
                    fout.write(aes.decrypt(chunk))
                    total_loaded += len(chunk)
                    content_loaded += len(chunk)

                    if content_loaded / float(content_length) * 100 > dots:
                        dots += 1
                        sys.stdout.write(".")
                        sys.stdout.flush()
            print ""

            if content_length < size_limit:
                break
   */
  // stub
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
