"use strict";

const { commonload } = require("./common");
const { request, requestRaw } = require("../request");
const { group, sleep } = require("../helper");

const load = async (url, urlParts, { limit, router }) => {
  const firstData = (await request({ url })).data;
  const link = group(
    /<a class="wp-body-box-action-red" id="file-download-free-action-slow" href="#" data-href="(.\S+)">Slow Download<\/a>/,
    firstData,
    1
  );
  const filename = group(/^\S*\/(\S+)$/, link, 1);
  console.log("loading %s", link);
  let code = 0;
  while (true) {
    let response = await requestRaw({ url: link });
    if (response.statusCode === 200) {
      break;
    } else if (response.statusCode === 302) {
      const location = response.rawHeaders[response.rawHeaders.indexOf("Location") + 1];
      code = parseFloat(group(/code=(\d+)/, location, 1));
      if (code === 266) {
        // short-wait
        console.info("waiting on download %s", filename);
        await sleep(60.5);
      } else if (code === 275) {
        // long-wait refresh-ip
        console.info("limit exceeded");
        if (router) {
          console.info("refreshing ip");
          await router.refreshIp();
        } else {
          return null;
        }
      } else {
        throw new Error(`unexpected code ${code}`);
      }
      continue;
    } else {
      throw new Error(`unexpected response status code ${response.statusCode}`);
    }
  }
  console.log("after waiting");
  return commonload({ filepath: filename, url: link, bytesPerSecond: limit });
};

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  load,
};
