"use strict"

const { sleep } = require("./helper")
const { request } = require("./request")

const fritzCall = async command => {
  const data = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:${command} xmlns:u="urn:schemas-upnp-org:service:WANIPConnection:1"></u:${command}>
</s:Body>
</s:Envelope>`
  const response = await request({
    url: "http://fritz.box:49000/igdupnp/control/WANIPConn1",
    headers: {
      "content-type": "text/xml",
      "content-length": data.length,
      SOAPACTION: `urn:schemas-upnp-org:service:WANIPConnection:1#${command}`
    },
    data
  })
  return response.data
}

const refreshIp = async () => {
  console.info("refreshing ip")
  await fritzCall("ForceTermination")
  await fritzCall("RequestConnection")
  await sleep(20)
}

module.exports = {
  refreshIp
}
