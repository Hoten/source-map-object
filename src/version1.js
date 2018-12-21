const { SourceMapConsumer } = require('source-map')

function debug(...args) {
  if (process.env.DEBUG) {
    console.log(...args)
  }
}

// first pass... got complicated
// not sure how to plug this into devtools (how to get "last generated column"?)
// https://cs.chromium.org/chromium/src/third_party/blink/renderer/devtools/front_end/sdk/SourceMap.js
// probably for the best, this is bonkers
module.exports = async function (generatedSource, map) {
  const originalObjectTokenToGeneratedPropertyToken = {}
  const generatedRowsStartAt = createRowsStartAt(generatedSource)

  function createRowsStartAt(source) {
    const rowsStartAt = [0]

    for (let i = 0; i < source.length; i++) {
      if (source[i] === "\n") {
        rowsStartAt.push(i + 1)
      }
    }

    return rowsStartAt
  }

  function getIndexFromRowCol(rowsStartAt, row, col) {
    return rowsStartAt[row - 1] + col
  }

  function findNextNonIdentifierChar(start) {
    let nextNonWhitespaceCharIndex = start
    debug(generatedSource.charAt(nextNonWhitespaceCharIndex))
    while (nextNonWhitespaceCharIndex < generatedSource.length && /[0-9a-zA-Z_$]/.test(generatedSource.charAt(nextNonWhitespaceCharIndex))) {
      nextNonWhitespaceCharIndex += 1
      debug(generatedSource.charAt(nextNonWhitespaceCharIndex))
    }
    return generatedSource.charAt(nextNonWhitespaceCharIndex)
  }

  await SourceMapConsumer.with(map, null, consumer => {
    consumer.computeColumnSpans()
    const mappings = []
    consumer.eachMapping(m => {
      mappings.push(m)
    })

    for (let i = 0; i < mappings.length; i++) {
      const m = mappings[i]
      // if (m.name!='getStuff')continue;
      // if (!(i >= 9 && i < 12))continue;
      debug('------')
      debug(i, m)
      const generatedIndex = getIndexFromRowCol(generatedRowsStartAt, m.generatedLine, m.generatedColumn)
      const generatedIndexEnd = getIndexFromRowCol(generatedRowsStartAt, m.generatedLine, m.lastGeneratedColumn)
      debug(generatedIndex, generatedSource.substring(generatedIndex, generatedIndexEnd))
      // if (m.name !== generatedSource.substring(generatedIndex, generatedIndexEnd)) {
      //   continue
      // }
      if (generatedSource.substring(generatedIndex, generatedIndexEnd) === 'this') {
        continue
      }

      const nextNonIdentifierChar = findNextNonIdentifierChar(getIndexFromRowCol(generatedRowsStartAt, m.generatedLine, m.generatedColumn))
      debug(nextNonIdentifierChar)

      if (nextNonIdentifierChar === '.') {
        const originalObjectToken = m.name

        const propertyMapping = mappings[i + 1]
        debug('propertyMapping', propertyMapping)

        const generatedString = generatedSource.substring(
          getIndexFromRowCol(generatedRowsStartAt, propertyMapping.generatedLine, propertyMapping.generatedColumn),
          propertyMapping.lastGeneratedColumn ? getIndexFromRowCol(generatedRowsStartAt, propertyMapping.generatedLine, propertyMapping.lastGeneratedColumn) : generatedSource.length,
        )
        debug(getIndexFromRowCol(generatedRowsStartAt, propertyMapping.generatedLine, propertyMapping.generatedColumn))
        debug(propertyMapping.lastGeneratedColumn ? getIndexFromRowCol(generatedRowsStartAt, propertyMapping.generatedLine, propertyMapping.lastGeneratedColumn) : generatedSource.length)

        // trim generated string to just the property name (source map positions can be a bit greedy)
        const generatedProperty = /([a-zA-Z_$0-9]*)/.exec(generatedString)[1]

        if (generatedProperty === propertyMapping.name) {
          // property name wasn't transformed, don't bother saving it
          continue;
        }
        debug('+', originalObjectToken, generatedProperty)

        if (!originalObjectTokenToGeneratedPropertyToken[originalObjectToken]) {
          originalObjectTokenToGeneratedPropertyToken[originalObjectToken] = new Set()
        }
        originalObjectTokenToGeneratedPropertyToken[originalObjectToken].add(generatedProperty)
      }
    }
  })

  return originalObjectTokenToGeneratedPropertyToken
}
