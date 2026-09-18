# rspack css entry startup

an entry whose import list holds a script and a stylesheet emits a bundle that throws at load on rspack 2.2.4 and later. the stylesheet module's factory is no longer in the module map, but the inlined startup still calls it

```
TypeError: e[249] is not a function
```

2.2.3 is fine. the test builds the same two files with 2.2.3 and 2.2.6, prints both bundles and runs them

```bash
npm install
npm test
```

## what it builds

```js
entry: { page: ['./src/plain.js', './src/styles.css'] },
experiments: { css: true },
module: { rules: [{ test: /\.css$/, type: 'css' }] },
mode: 'production'
```

## 2.2.3

```js
(()=>{"use strict";var r={249(r){r.exports={}},829(){console.log("page")}},e={};function o(t){...}o(829),o(249)})();
```

the stylesheet keeps an empty factory and the startup goes through a real require

## 2.2.6

```js
(()=>{"use strict";var e={829(){console.log("page")}};e[829](),e[249]()})();
```

`page` prints, then `e[249] is not a function`. `dist/2.2.6/page.css` is emitted and correct

## notes

- same result with the stylesheet first in the array, and when the script also imports the stylesheet itself
- a single script entry that only imports the stylesheet is fine on every version, so this is about the entry's import list
- optimization options do not matter, the config above is enough
- 2.2.4 is the release that added CSS entry bundling (web-infra-dev/rspack#14879), which is where to look first
- webpack skips entry modules without a JavaScript source type when it renders the bootstrap, rspack does not

filed as web-infra-dev/rspack#15766, fix in web-infra-dev/rspack#15767
