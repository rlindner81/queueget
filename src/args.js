"use strict"

const { assert, ordinal } = require("./helper")

const usage = () => `
usage: qget [<options>]

options:
  --queue-file    links to download (defaults to queue.txt)
  --history-file  links of the past (defaults to queue_history.txt)
  --restore-file  links to restore before starting (debugging)
  --retries       number of retries for failing downloads (defaults to 3)
  --router        router for ip refreshing (defaults to fritzbox)
`

const _unquoteArg = arg => {
  return arg.replace(/^'(.+)'$/, "$1").replace(/^"(.+)"$/, "$1")
}

const parseArgs = args => {
  let queueFile = "queue.txt"
  let historyFile = "queue_history.txt"
  let restoreFile = null
  let retries = 3
  let routername = "fritzbox"

  let parsedOptions = 0
  const rest = args
    .join(" ")
    .trim()
    .replace(
      /--(queue-file|history-file|restore-file|retries|router)\s*(.*?)\s*(?=$|--(?:queue-file|history-file|restore-file|retries|router))/g,
      (_, option, arg) => {
        const unquotedArg = _unquoteArg(arg)
        parsedOptions++
        assert(unquotedArg.length !== 0, `${ordinal(parsedOptions)} option --${option} has no associated argument`)

        switch (option) {
          case "queue-file":
            queueFile = unquotedArg
            break
          case "history-file":
            historyFile = unquotedArg
            break
          case "restore-file":
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

  return { queueFile, historyFile, restoreFile, retries, routername }
}

module.exports = {
  usage,
  parseArgs
}
