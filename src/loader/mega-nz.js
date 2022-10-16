"use strict";

const { sep: pathSep } = require("path");
const { commonload } = require("./common");
const { sleep, base64urlDecode, decrypt, aesEcbDecipher, aesCbcDecipher, aesCtrDecipher } = require("../helper");
const { request } = require("../request");
const { readableRelativeDateTime } = require("../datetime");

const LINK_TYPE = {
  FILE: "#",
  FOLDER: "#F",
};

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
  let result = Buffer.alloc(16, 0);
  Buffer.from(key).forEach((c, i) => {
    result[i % 16] ^= c;
  });
  return result;
};

const _api = async (query = null, data = null) => {
  if (!Array.isArray(data)) {
    data = [data];
  }
  let response;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      response = await request({ method: "POST", url: "https://g.api.mega.co.nz/cs", query, data });
      break;
    } catch (err) {
      // NOTE: shameful workaround for sporadic unresolved ssl protocol bug
      //  write EPROTO 8076:error:1421C0F8:SSL routines:set_client_ciphersuite:unknown cipher returned:c:\ws\deps\openssl\openssl\ssl\statem\statem_clnt.c:1343:
      if (err.code === "EPROTO" && err.errno === -4046) {
        continue;
      }
      throw err;
    }
  }
  const result = Array.isArray(response.data) && response.data.length === 1 ? response.data[0] : response.data;
  if (typeof result === "number" && result < 0) {
    throw new Error("file does not exist");
  }
  return result;
};

const _decryptAttributes = (attributes, key, doFold = true) => {
  attributes = base64urlDecode(attributes);
  attributes = decrypt(aesCbcDecipher(doFold ? _foldKey(key) : key), attributes);
  attributes = attributes.toString();
  if (attributes.slice(0, 4) !== "MEGA") {
    throw new Error("failed attribute decryption");
  }
  attributes = JSON.parse(attributes.slice(4).replace(/}.*?$/, "}"));
  return attributes;
};

const load = async (url, urlParts, { flatten, limit, router }) => {
  const _downloadAndDecrypt = (link, filepath, key) => {
    const iv = Buffer.concat([key.slice(16, 24), Buffer.alloc(8, 0)]);
    let decipher = null;
    const requestSize = 500000000; // 0.5GB
    return commonload({
      filepath,
      url: link,
      bytesPerSecond: limit,
      requestSize,
      errorStatusHandler: async (response) => {
        if (response.statusCode === 509) {
          if (router) {
            console.info("bandwidth limit exceeded refreshing ip");
            await router.refreshIp();
          } else {
            const timeLeft = parseFloat(response.headers["x-mega-time-left"]);
            const freeAgain = new Date();
            freeAgain.setSeconds(freeAgain.getSeconds() + timeLeft);
            console.info(`bandwidth limit exceeded sleeping ${readableRelativeDateTime(freeAgain)}`);
            await sleep(timeLeft);
          }
          return true;
        }
        throw new Error(`bad response ${response.statusCode} (${response.statusMessage})`);
      },
      chunkTransform: {
        initialize: () => (decipher = aesCtrDecipher(_foldKey(key), iv)),
        update: (chunk) => decipher.update(chunk),
        finalize: () => decipher.final(),
      },
    });
  };

  const _getFile = (data, key, filepath = null) => {
    const link = data.g;
    filepath = filepath || _decryptAttributes(data.at, key).n;
    return _downloadAndDecrypt(link, filepath, key);
  };

  const { pathname: urlPathname, hash: urlHash } = urlParts;
  let linkType, linkId, linkKey;
  if (urlPathname === "/") {
    [linkType, linkId, linkKey] = urlHash.split("!");
  } else if (urlPathname.startsWith("/file/")) {
    [linkType, linkId, linkKey] = [LINK_TYPE.FILE, urlPathname.substring("/file/".length), urlHash.substring(1)];
  } else if (urlPathname.startsWith("/folder/")) {
    [linkType, linkId, linkKey] = [LINK_TYPE.FOLDER, urlPathname.substring("/folder/".length), urlHash.substring(1)];
  } else {
    throw new Error(`unknown pathname ${urlPathname}`);
  }

  switch (linkType) {
    case LINK_TYPE.FILE: {
      let fileId = linkId;
      let fileKey = base64urlDecode(linkKey);
      let fileData = await _api(null, { a: "g", g: 1, p: fileId });
      return _getFile(fileData, fileKey);
    }
    case LINK_TYPE.FOLDER: {
      let folderId = linkId;
      let folderKey = base64urlDecode(linkKey);
      let folderData = await _api({ n: folderId }, { a: "f", c: 1, r: 1 });

      // NOTE: collect filenames with associated decryption info, then sort and load them.
      let folders = {};
      let files = [];
      for (const node of folderData.f) {
        const isFile = node.t === 0;
        const isFolder = node.t === 1;
        if (!isFile && !isFolder) {
          continue;
        }
        let nodeKey = node.k.split(":")[1];
        nodeKey = base64urlDecode(nodeKey);
        nodeKey = decrypt(aesEcbDecipher(_foldKey(folderKey)), nodeKey);
        const nodeId = node.h;
        const nodeParentId = node.p;
        const nodeName = _decryptAttributes(node.a, nodeKey, isFile).n;
        if (isFolder) {
          if (flatten) {
            continue;
          }
          folders[nodeId] = folders[nodeParentId] ? [folders[nodeParentId], nodeName].join(pathSep) : nodeName;
        } else if (isFile) {
          const nodeData = await _api({ n: folderId }, { a: "g", g: 1, n: nodeId });
          files.push({
            filepath: folders[nodeParentId] ? [folders[nodeParentId], nodeName].join(pathSep) : nodeName,
            nodeData,
            fileKey: nodeKey,
          });
        }
      }

      files.sort((a, b) => a.filepath.localeCompare(b.filepath));
      for (const { filepath, nodeData, fileKey } of files) {
        await _getFile(nodeData, fileKey, filepath);
      }
      return files.map(({ filepath }) => filepath);
    }
    default:
      throw new Error(`unknown mega link type ${linkType}`);
  }
};

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  load,
};
