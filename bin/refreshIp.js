#!/usr/bin/env node
"use strict";

const fritzbox = require("../src/router/fritzbox");

(async () => {
  await fritzbox.refreshIp();
})();
