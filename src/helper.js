"use strict"

const crypto = require("crypto")
const { promisify } = require("util")

const group = (regex, data, index = null) => {
  const result = regex.exec(data)
  if (result && result.length >= 1) {
    return index === null ? result.slice(1) : result.length > index ? result[index] : null
  }
  return null
}

const assert = (condition, errorMessage) => {
  if (!condition) {
    throw new Error(errorMessage)
  }
}

// https://stackoverflow.com/questions/13627308/add-st-nd-rd-and-th-ordinal-suffix-to-a-number
const ordinal = a =>
  a + ["th", "st", "nd", "rd"][((a = ~~(a < 0 ? -a : a) % 100) > 10 && a < 14) || (a %= 10) > 3 ? 0 : a]

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

const aesEcbDecipher = (key, iv = null, autoPadding = false) =>
  crypto.createDecipheriv("aes-128-ecb", key, iv).setAutoPadding(autoPadding)
const aesCbcDecipher = (key, iv = Buffer.alloc(16, 0), autoPadding = false) =>
  crypto.createDecipheriv("aes-128-cbc", key, iv).setAutoPadding(autoPadding)
const aesCtrDecipher = (key, iv = Buffer.alloc(16, 0), autoPadding = false) =>
  crypto.createDecipheriv("aes-128-ctr", key, iv).setAutoPadding(autoPadding)
const decrypt = (decipher, data) => Buffer.concat([decipher.update(data), decipher.final()])

module.exports = {
  group,
  assert,
  ordinal,
  sleep,
  randomHex,
  base64encode,
  base64decode,
  base64urlDecode,
  base64urlEncode,
  aesEcbDecipher,
  aesCbcDecipher,
  aesCtrDecipher,
  decrypt
}
