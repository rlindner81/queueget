"use strict"

module.exports = {
  "www.filefactory.com": require("./www-filefactory-com"),
  "1fichier.com": require("./1fichier-com"),
  "mega.nz": require("./mega-nz"),
  fallback: require("./fallback"),
}
