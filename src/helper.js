"use strict"

const crypto = require("crypto")
const { promisify } = require("util")

const randomBytes = promisify(crypto.randomBytes)

const sleep = sec => new Promise(resolve => setTimeout(resolve, sec * 1000))

const randomHex = async byteLength => (await randomBytes(byteLength)).toString("hex")

const base64encode = input => Buffer.from(input).toString("base64")
const base64decode = input => Buffer.from(input, "base64")
const base64urlEncode = input =>
  base64encode(input)
    .replace(/\+/g, "-")
    .replace(/_/g, "/")
    .replace(/=/g, "")
const base64urlDecode = input =>
  base64decode(
    input
      .replace(/-/g, "+")
      .replace(/\//g, "_")
      .replace(/,/g, "")
  )

const foldKey = key => {
  let result = Buffer.alloc(16, 0)
  Buffer.from(key).forEach((c, i) => {
    result[i % 16] ^= c
  })
  return result
}

const aesEcbEncrypt = (data, key) => {
  const cipher = crypto.createCipheriv("aes-128-ecb", key, null).setAutoPadding(false)
  return Buffer.concat([cipher.update(data), cipher.final()])
}
const aesEcbDecrypt = (data, key) => {
  const decipher = crypto.createDecipheriv("aes-128-ecb", key, null).setAutoPadding(false)
  return Buffer.concat([decipher.update(data), decipher.final()])
}

const aesCbcEncrypt = (data, key) => {
  const cipher = crypto.createCipheriv("aes-128-cbc", key, Buffer.alloc(16, 0)).setAutoPadding(false)
  return Buffer.concat([cipher.update(data), cipher.final()])
}
const aesCbcDecrypt = (data, key) => {
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, Buffer.alloc(16, 0)).setAutoPadding(false)
  return Buffer.concat([decipher.update(data), decipher.final()])
}

module.exports = {
  sleep,
  randomHex,
  base64encode,
  base64decode,
  base64urlDecode,
  base64urlEncode,
  foldKey,
  aesEcbEncrypt,
  aesEcbDecrypt,
  aesCbcEncrypt,
  aesCbcDecrypt
}
