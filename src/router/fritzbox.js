"use strict";

const { sleep } = require("../helper");
const { request } = require("../request");

const SLEEP_STEP = 20;
const SLEEP_LIMIT = 100;

const fritzCall = async (command) => {
  const data = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:${command} xmlns:u="urn:schemas-upnp-org:service:WANIPConnection:1"></u:${command}>
</s:Body>
</s:Envelope>`;
  const response = await request({
    method: "POST",
    url: "http://fritz.box:49000/igdupnp/control/WANIPConn1",
    headers: {
      "content-type": "text/xml",
      "content-length": data.length,
      SOAPACTION: `urn:schemas-upnp-org:service:WANIPConnection:1#${command}`,
    },
    data,
  });
  return response.data;
};

const getExternalIp = async () => {
  try {
    const response = await request({
      url: "https://api.ipify.org",
    });
    return response.data;
  } catch (err) {
    return null;
  }
};

const refreshIp = async () => {
  const oldIp = await getExternalIp();
  await fritzCall("ForceTermination");
  await fritzCall("RequestConnection");
  if (oldIp) {
    let newIp = oldIp;
    let sleepTime = 0;
    for (; newIp === oldIp && sleepTime <= SLEEP_LIMIT; sleepTime += SLEEP_STEP) {
      await sleep(SLEEP_STEP);
      newIp = await getExternalIp();
    }
    if (newIp !== oldIp) {
      console.log('successfully changed ip from "%s" to "%s" in %isec', oldIp, newIp, sleepTime);
    } else {
      console.warn('warning: failed changing ip from "%s" in time limit %isec', oldIp, sleepTime);
    }
  } else {
    const fallbackSleepTime = SLEEP_LIMIT / 2;
    console.warn("warning: could not read external ip, using fallback refresh time of %isec", fallbackSleepTime);
    await sleep(fallbackSleepTime);
  }
};

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  refreshIp,
};
