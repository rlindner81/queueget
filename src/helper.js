"use strict"

const crypto = require("crypto")
const { promisify } = require("util")

const randomBytes = promisify(crypto.randomBytes)

const sleep = sec => new Promise(resolve => setTimeout(resolve, sec * 1000))

const randomHex = async byteLength => (await randomBytes(byteLength)).toString("hex")

const base64encode = input => Buffer.from(input).toString("base64")
const base64decode = input => Buffer.from(input, "base64").toString()
const base64urlEncode = input =>
  base64encode(
    input
      .replace(/\+/g, "-")
      .replace(/_/g, "/")
      .replace(/=/g, "")
  )
const base64urlDecode = input =>
  base64decode(
    input
      .replace(/-/g, "+")
      .replace(/\//g, "_")
      .replace(/,/g, "")
  )

// eslint-disable-next-line no-unused-vars
const aesEcbDecrypt = input => {
  // stub
}

module.exports = {
  sleep,
  randomHex,
  base64encode,
  base64decode,
  base64urlDecode,
  base64urlEncode,
  aesEcbDecrypt
}
