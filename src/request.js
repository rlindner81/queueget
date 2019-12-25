"use strict"

const http = require("http")
const https = require("https")
const { URL } = require("url")

// const parseSetCookie = setCookie => {
//   return setCookie.reduce((result, cookie) => {
//     cookie = cookie.split(";")[0].split("=")
//     result[cookie[0]] = querystring.unescape(cookie[1])
//     return result
//   }, {})
// }

const request = (method = "GET", url, query, data, headers, resDataHandler) =>
  new Promise((resolve, reject) => {
    const requestUrl = new URL(url)

    if (query instanceof Object) {
      Object.entries(query).forEach(([key, value]) => {
        requestUrl.searchParams.append(key, value)
      })
    }

    const requestOptions = { method, headers }

    // if (options.cookies) {
    //   options.headers.Cookie = Object.entries(options.cookies)
    //     .map(([key, value]) => key + "=" + querystring.escape(value))
    //     .join("; ")
    // }

    const _resHandler = res => {
      let buffer = Buffer.alloc(0)
      let writtenBytes = 0
      const bufferResDataHandler = resData => {
        buffer = Buffer.concat([buffer, resData])
        writtenBytes += resData.length
      }
      res.on("data", resDataHandler ? resDataHandler : bufferResDataHandler)
      res.on("end", () => {
        const { statusCode, statusMessage, headers } = res
        const result = { statusCode, statusMessage, headers }
        const contentType = res.headers["content-type"]

        if (writtenBytes > 0) {
          result.data = contentType === "application/json" ? JSON.parse(buffer.toString()) : buffer.toString()
        }
        // if (result.headers["set-cookie"]) {
        //   result.cookies = parseSetCookie(result.headers["set-cookie"])
        // }

        return resolve(result)
      })
    }

    const req = requestUrl.protocol === "https:"
      ? https.request(requestUrl, requestOptions, _resHandler)
      : http.request(requestUrl, requestOptions, _resHandler)

    if (data) {
      if (data instanceof Object) {
        data = JSON.stringify(data)
      }
      req.write(data)
    }
    req.on("error", reject)
    req.end()
  })

;(async () => {
  const lala = await request("GET", "https://google.com?test=1", { a: 1 })
  const i = 0
})()

module.exports = request
