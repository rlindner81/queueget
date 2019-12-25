"use strict"

const { sleep } = require("./helper")
const { request } = require("./request")

const fritzCall = async command => {
  const response = await request({
    url: "http://fritz.box:49000/igdupnp/control/WANIPConn1",
    headers: {
      "content-type": "text/xml",
      SOAPACTION: `urn:schemas-upnp-org:service:WANIPConnection:1#${command}`
    },
    data: `<?xml version='1.0' encoding='utf-8'?>
<s:Envelope s:encodingStyle='http://schemas.xmlsoap.org/soap/encoding/' xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'>
  <s:Body>
    <u:${command} xmlns:u='urn:schemas-upnp-org:service:WANIPConnection:1' />
  </s:Body>
</s:Envelope>`
  })
  return response.data
}

const refreshIp = async () => {
  console.info("refreshing ip")
  let res = await fritzCall("ForceTermination")
  res = await fritzCall("RequestConnection")
  await sleep(20)
}

module.exports = {
  refreshIp
}
