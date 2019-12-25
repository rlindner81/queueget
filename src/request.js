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

const requestRaw = ({ url, method = "GET", query, data, headers }) =>
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

    const requestOptions = { method, headers }
    const req =
      requestUrl.protocol === "https:"
        ? https.request(requestUrl, requestOptions, resolve)
        : http.request(requestUrl, requestOptions, resolve)

    if (data) {
      req.write(data instanceof Buffer ? data : _toStr(data))
    }
    req.on("error", reject)
    req.end()
  })

const request = async ({ url, method = "GET", query, data, headers }) => {
  const res = await requestRaw({ url, method, query, data, headers })
  return await new Promise(resolve => {
    let buffer = Buffer.alloc(0)
    let byteLength = 0

    res.on("data", resData => {
      buffer = Buffer.concat([buffer, resData])
      byteLength += resData.length
    })

    res.on("end", () => {
      const { statusCode, statusMessage, headers } = res
      const result = { statusCode, statusMessage, headers }
      const contentType = res.headers["content-type"]

      if (byteLength > 0) {
        result.data = contentType === "application/json" ? JSON.parse(buffer.toString()) : buffer.toString()
      }

      return resolve(result)
    })
  })
}

// ;(async () => {
//   const lala = await request("GET", "https://google.com?test=1", { a: 1 })
//   const i = 0
// })()

module.exports = {
  requestRaw,
  request
}
