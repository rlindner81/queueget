"use strict";

const { assert, ordinal } = require("./helper");
const { version } = require("../package.json");

const usageText = () => `
usage: qget [<options>]

options:
  --queue FILE       links to download (defaults to queue.txt)
  --history FILE     links of the past (defaults to queue_history.txt)
  --restore FILE     restore queue before starting for debugging
  --retries NUMBER   number of retries for failing downloads (defaults to 3)
  --limit NUMBER     bytes per second limit for download (defaults to 0, no limit)
  --router TYPE      router for ip refreshing, e.g. fritzbox
  --flatten          ignore directories
`;

const versionText = () => `version ${version}`;

const _unquoteArg = (arg) => {
  return arg.replace(/^'(.+)'$/, "$1").replace(/^"(.+)"$/, "$1");
};

const parseArgs = (args) => {
  let queueFile = "queue.txt";
  let historyFile = "queue_history.txt";
  let restoreFile = null;
  let retries = 3;
  let limit = 0;
  let routername = null;
  let help = false;
  let version = false;
  let flatten = false;

  let parsedOptions = 0;
  const rest = args
    .join(" ")
    .trim()
    .replace(
      /--(help|version|flatten|queue|history|restore|retries|limit|router)\s*(.*?)\s*(?=$|--(?:help|version|flatten|queue|history|restore|retries|limit|router))/g,
      (_, option, arg) => {
        const unquotedArg = _unquoteArg(arg);
        parsedOptions++;

        assert(
          ["version", "help", "flatten"].includes(option) || unquotedArg.length !== 0,
          `${ordinal(parsedOptions)} option --${option} has no associated argument`
        );

        switch (option) {
          case "version":
            version = true;
            break;
          case "help":
            help = true;
            break;
          case "flatten":
            flatten = true;
            break;
          case "queue":
            queueFile = unquotedArg;
            break;
          case "history":
            historyFile = unquotedArg;
            break;
          case "restore":
            restoreFile = unquotedArg;
            break;
          case "retries":
            retries = parseFloat(unquotedArg);
            break;
          case "limit":
            limit = parseFloat(unquotedArg);
            break;
          case "router":
            routername = unquotedArg;
            break;
          default:
            assert(false, `encountered unknown option --${option}`);
        }
        return "";
      }
    );
  assert(rest.length === 0, `missed (partial) arguments '${rest}'`);

  return { help, version, flatten, queueFile, historyFile, restoreFile, retries, limit, routername };
};

module.exports = {
  versionText,
  usageText,
  parseArgs,
};
