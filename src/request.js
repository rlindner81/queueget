"use strict";

const https = require("https");
const querystring = require("querystring");
const urlParse = require("url").parse;

const parseSetCookie = (setCookie) => {
  return setCookie.reduce((result, cookie) => {
    cookie = cookie.split(";")[0].split("=");
    result[cookie[0]] = querystring.unescape(cookie[1]);
    return result;
  }, {});
};

const request = (urlInput, options) => {
  return new Promise((resolve, reject) => {
    let url = urlParse(urlInput);
    options = Object.assign({}, url, options);

    if (options.params) {
      options.path += "?" + querystring.stringify(options.params);
    }

    let data = options.data;
    delete options.data;

    if (options.cookies) {
      options.headers.Cookie = Object.entries(options.cookies).map(([key, value]) => key + "=" + querystring.escape(value)).join("; ");
    }

    let req = https.request(options, res => {
      res.setEncoding("utf8");
      let buffer = "";
      res.on("data", sData => {
        buffer += sData;
      });
      res.on("end", () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Calling ${urlInput} failed with HTTP status code ${res.statusCode}`));
        } else {
          let result = Object.assign({}, res);
          if (buffer) {
            try {
              result.data = JSON.parse(buffer);
            } catch (err) {
              result.data = buffer;
            }
          }
          if (result.headers["set-cookie"]) {
            result.cookies = parseSetCookie(result.headers["set-cookie"]);
          }

          resolve(result);
        }
      });
    });

    if (data) {
      if (data instanceof Object) {
        data = JSON.stringify(data);
      }
      req.write(data);
    }
    req.on("error", reject);
    req.end();
  });
};

module.exports = request
