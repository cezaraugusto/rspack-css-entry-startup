import {createRequire} from 'node:module'
import {readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const build = (alias) =>
  new Promise((resolve, reject) => {
    const {rspack, rspackVersion} = require(alias)
    const out = join(here, 'dist', rspackVersion)

    rspack(
      {
        mode: 'production',
        context: here,
        devtool: false,
        entry: {page: ['./src/plain.js', './src/styles.css']},
        experiments: {css: true},
        module: {rules: [{test: /\.css$/, type: 'css'}]},
        output: {path: out, filename: '[name].js', clean: true}
      },
      (error, stats) => {
        if (error) return reject(error)
        if (stats.hasErrors()) return reject(new Error(stats.toString('errors-only')))
        resolve({version: rspackVersion, bundle: join(out, 'page.js')})
      }
    )
  })

const run = (bundle) => {
  const context = vm.createContext({console})
  vm.runInContext(readFileSync(bundle, 'utf8'), context, {filename: bundle})
}

let failed = false

for (const alias of ['rspack-2.2.3', 'rspack-2.2.6']) {
  const {version, bundle} = await build(alias)
  const source = readFileSync(bundle, 'utf8')
  console.log(`\nrspack ${version}\n${source}`)

  try {
    run(bundle)
    console.log(`ok: the bundle runs clean`)
  } catch (error) {
    failed = true
    console.log(`FAIL: ${error.message}`)
  }
}

process.exit(failed ? 1 : 0)
