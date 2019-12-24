"use strict"

const https = require("https")
const { URL } = require("url")

// const parseSetCookie = setCookie => {
//   return setCookie.reduce((result, cookie) => {
//     cookie = cookie.split(";")[0].split("=")
//     result[cookie[0]] = querystring.unescape(cookie[1])
//     return result
//   }, {})
// }

const request = (method = "GET", url, query, reqData, headers, resDataHandler) => {
  const requestUrl = new URL(url)

  if (query instanceof Object) {
    Object.entries(query).forEach(([key, value]) => {
      requestUrl.searchParams.append(key, value)
    })
  }

  const requestOptions = { method, headers }

  return new Promise((resolve, reject) => {
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
        if (res.statusCode >= 400) {
          return reject(new Error(`request ${res.url} failed with status ${res.statusCode} (${res.statusMessage})`))
        }
        const contentType = res.headers["content-type"]

        if (writtenBytes > 0) {
          const resData = buffer.toString()
          res.data = contentType === "application/json" ? JSON.parse(resData) : resData
        }
        // if (result.headers["set-cookie"]) {
        //   result.cookies = parseSetCookie(result.headers["set-cookie"])
        // }

        return resolve(res)
      })
    }

    const req = https.request(requestUrl, requestOptions, _resHandler)

    if (reqData) {
      if (reqData instanceof Object) {
        reqData = JSON.stringify(reqData)
      }
      req.write(reqData)
    }
    req.on("error", reject)
    req.end()
  })
}

;(async () => {
  const lala = await request("GET", "https://google.com?test=1", { a: 1 })
  const i = 0
})()

module.exports = request
