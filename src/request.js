"use strict"

const http = require("http")
const https = require("https")
const { URL } = require("url")

const _toStr = input => {
  switch (typeof input) {
    case "undefined":
    case "symbol":
    case "function":
      return ""
    case "string":
      return input
    case "object":
      return input === null ? "" : JSON.stringify(input)
    default:
      return String(input)
  }
}

const requestRaw = ({ url, method, query, data, headers }) =>
  new Promise((resolve, reject) => {
    if (!url) {
      return resolve(null)
    }
    const requestUrl = new URL(url)

    if (query instanceof Object) {
      Object.entries(query).forEach(([key, value]) => {
        requestUrl.searchParams.append(key, _toStr(value))
      })
    }

    const requestOptions = {
      method: method ? method : data ? "POST" : "GET",
      headers
    }

    const req =
      requestUrl.protocol === "https:"
        ? https.request(requestUrl, requestOptions, resolve)
        : http.request(requestUrl, requestOptions, resolve)

    req.on("error", reject)

    if (data) {
      req.end(Buffer.isBuffer(data) ? data : Buffer.from(_toStr(data)))
    } else {
      req.end()
    }
  })

const request = async ({ url, method, query, data, headers }) => {
  const response = await requestRaw({ url, method, query, data, headers })
  let buffer = Buffer.alloc(0)
  for await (const chunk of response) {
    buffer = Buffer.concat([buffer, chunk])
  }

  const contentType = response.headers["content-type"]
  if (buffer.length > 0) {
    response.data = contentType === "application/json" ? JSON.parse(buffer.toString()) : buffer.toString()
  }
  return response
}

module.exports = {
  requestRaw,
  request
}
