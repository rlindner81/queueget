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

const aesEcbCipher = key => crypto.createCipheriv("aes-128-ecb", key, null).setAutoPadding(false)
const aesEcbDecipher = key => crypto.createDecipheriv("aes-128-ecb", key, null).setAutoPadding(false)
const aesCbcCipher = (key, iv = Buffer.alloc(16, 0)) => crypto.createCipheriv("aes-128-cbc", key, iv).setAutoPadding(false)
const aesCbcDecipher = (key, iv = Buffer.alloc(16, 0)) => crypto.createDecipheriv("aes-128-cbc", key, iv).setAutoPadding(false)
const aesCrtCipher = (key, iv) => crypto.createCipheriv("aes-128-crt", key, iv).setAutoPadding(false)
const aesCrtDecipher = (key, iv) => crypto.createDecipheriv("aes-128-crt", key, iv).setAutoPadding(false)
const encrypt = (cipher, data) => Buffer.concat([cipher.update(data), cipher.final()])
const decrypt = (decipher, data) => Buffer.concat([decipher.update(data), decipher.final()])

module.exports = {
  sleep,
  randomHex,
  base64encode,
  base64decode,
  base64urlDecode,
  base64urlEncode,
  aesEcbCipher,
  aesEcbDecipher,
  aesCbcCipher,
  aesCbcDecipher,
  aesCrtCipher,
  aesCrtDecipher,
  encrypt,
  decrypt
}
