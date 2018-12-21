const getObjectMappingV1 = require('../src/version1.js')
const getObjectMappingV2 = require('../src/version2.js')

const fs = require('fs')
const mapPath = __dirname + '/../test/app-dist/app.5753e952.map'
const generatedSourcePath = __dirname + '/../test/app-dist/app.5753e952.js'
const mapJson = fs.readFileSync(mapPath, 'utf-8')
const generatedSource = fs.readFileSync(generatedSourcePath, 'utf-8')
const map = JSON.parse(mapJson)

// make map pretty
fs.writeFileSync(mapPath, JSON.stringify(map, null, 2))

async function tryAllVersions(generatedSource, map) {
  console.log("version1\n", await getObjectMappingV1(generatedSource, map))
  console.log("version2\n", JSON.stringify(await getObjectMappingV2.withSourceMapModuleAdaptor(generatedSource, map), null, 2))
}

tryAllVersions(generatedSource, map)
