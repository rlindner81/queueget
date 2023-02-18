"use strict";

const { sleep } = require("../helper");
const { request } = require("../request");

const SLEEP_REFRESH_DELAY = 120;
const SLEEP_CONNECTION_GAP = 20;
const SLEEP_LIMIT = 200;

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
  let totalSleepTime = 0;
  const oldIp = await getExternalIp();
  const _refresh = async (delay) => {
    console.log("requesting new ip with %isec delay between termination and re-connect", delay);
    await fritzCall("ForceTermination");
    await sleep(delay);
    totalSleepTime += delay;
    await fritzCall("RequestConnection");
    await sleep(SLEEP_CONNECTION_GAP);
    totalSleepTime += SLEEP_CONNECTION_GAP;
  };
  if (!oldIp) {
    console.warn("warning: could not read external ip, cannot validate if refresh works");
    await _refresh(SLEEP_REFRESH_DELAY);
    return;
  }

  let newIp = oldIp;
  for (; newIp === oldIp && totalSleepTime <= SLEEP_LIMIT; ) {
    await _refresh(SLEEP_REFRESH_DELAY);
    newIp = await getExternalIp();
  }
  if (newIp !== oldIp) {
    console.log('successfully changed ip from "%s" to "%s" in %isec', oldIp, newIp, totalSleepTime);
  } else {
    console.warn('warning: failed changing ip from "%s" in time limit %isec', oldIp, totalSleepTime);
  }
  // TODO this needs an interface change because it will loop infinitely if the ip doesn't change and refreshIp gets
  //  called again from outside
};

module.exports = {
  name: __filename.slice(__dirname.length + 1, -3),
  refreshIp,
};
