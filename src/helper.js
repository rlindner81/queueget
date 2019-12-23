"use strict"

const sleep = sec => new Promise(resolve => setTimeout(resolve, sec * 1000))

module.exports = {
  sleep
}
