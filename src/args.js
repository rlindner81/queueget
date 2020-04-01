"use strict"

const { assert, ordinal } = require("./helper")

const usage = () => `
usage: qget [<options>]

options:
  --queue FILE       links to download (defaults to queue.txt)
  --history FILE     links of the past (defaults to queue_history.txt)
  --restore FILE     restore queue before starting for debugging
  --retries NUMBER   number of retries for failing downloads (defaults to 3)
  --router TYPE      router for ip refreshing, e.g. fritzbox
`

const _unquoteArg = (arg) => {
  return arg.replace(/^'(.+)'$/, "$1").replace(/^"(.+)"$/, "$1")
}

const parseArgs = (args) => {
  let queueFile = "queue.txt"
  let historyFile = "queue_history.txt"
  let restoreFile = null
  let retries = 3
  let routername = null
  let help = false

  let parsedOptions = 0
  const rest = args
    .join(" ")
    .trim()
    .replace(
      /--(help|queue|history|restore|retries|router)\s*(.*?)\s*(?=$|--(?:help|queue|history|restore|retries|router))/g,
      (_, option, arg) => {
        const unquotedArg = _unquoteArg(arg)
        parsedOptions++

        if (option === "help") {
          help = true
          return ""
        }
        assert(unquotedArg.length !== 0, `${ordinal(parsedOptions)} option --${option} has no associated argument`)

        switch (option) {
          case "queue":
            queueFile = unquotedArg
            break
          case "history":
            historyFile = unquotedArg
            break
          case "restore":
            restoreFile = unquotedArg
            break
          case "retries":
            retries = parseFloat(unquotedArg)
            break
          case "router":
            routername = unquotedArg
            break
          default:
            assert(false, `encountered unknown option --${option}`)
        }

        return ""
      }
    )
  assert(rest.length === 0, `missed (partial) arguments '${rest}'`)

  return { help, queueFile, historyFile, restoreFile, retries, routername }
}

module.exports = {
  usage,
  parseArgs,
}
