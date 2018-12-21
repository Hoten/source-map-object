const { SourceMapConsumer } = require('source-map')

function debug(...args) {
  if (process.env.DEBUG) {
    console.log(...args)
  }
}

// just some... simple regex
module.exports = function (generatedSource, getOriginalPositionFor) {
  const originalObjectTokenToGeneratedPropertyToken = {}

  const re = /(^\r\n|\r|\n)|([a-zA-Z0-9_$]+)\.([a-zA-Z0-9_$]+)/g
  let matches
  let row = 1, rowBeginsAtIndex = 0
  while ((matches = re.exec(generatedSource)) !== null) {
    const [, isNewline, object, property] = matches
    if (isNewline) {
      row++;
      rowBeginsAtIndex = matches.index;
      continue;
    }
    if (object === 'this') {
      continue
    }

    debug(object, property)
    debug(row, matches.index - rowBeginsAtIndex)
    re.lastIndex -= property.length

    const objectPos = getOriginalPositionFor(
      row,
      matches.index - rowBeginsAtIndex
    )
    const propertyPos = getOriginalPositionFor(
      row,
      matches.index - rowBeginsAtIndex + object.length + 1
    )

    if (propertyPos.name === property) {
      continue
    }

    const originalObjectToken = objectPos.name
    const generatedProperty = property

    if (!originalObjectToken) {
      continue
    }

    if (!originalObjectTokenToGeneratedPropertyToken[originalObjectToken]) {
      originalObjectTokenToGeneratedPropertyToken[originalObjectToken] = {}
    }
    if (!originalObjectTokenToGeneratedPropertyToken[originalObjectToken][generatedProperty]) {
      originalObjectTokenToGeneratedPropertyToken[originalObjectToken][generatedProperty] = []
    }
    if (!originalObjectTokenToGeneratedPropertyToken[originalObjectToken][generatedProperty].includes(propertyPos.name)) {
      originalObjectTokenToGeneratedPropertyToken[originalObjectToken][generatedProperty].push(propertyPos.name)
    }
  }

  return originalObjectTokenToGeneratedPropertyToken
}

// use the 'source-map' module
module.exports.withSourceMapModuleAdaptor = function (generatedSource, map) {
  return SourceMapConsumer.with(map, null, consumer => {
    const sourceMapAdaptor = (line, column) => consumer.originalPositionFor({ line, column })
    return module.exports(generatedSource, sourceMapAdaptor)
  })
}

// use DevTools impl: https://cs.chromium.org/chromium/src/third_party/blink/renderer/devtools/front_end/sdk/SourceMap.js?l=161
module.exports.withDevToolsSourceMapAdaptor = function (generatedSource, map) {
  const sourceMapAdaptor = (line, column) => map.findEntry(line, column)
  return module.exports.version2(generatedSource, sourceMapAdaptor)
}
