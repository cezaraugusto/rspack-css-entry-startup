# ready to paste, web-infra-dev/rspack issue

title: `An entry that lists a CSS file next to a script emits a startup call to a module it no longer defines (2.2.4+)`

## System Info

macOS arm64, Node 24.18.1, @rspack/core 2.2.3 vs 2.2.6, @rspack/binding matched to each

## Details

since 2.2.4, a JavaScript entry whose import list holds a script AND a stylesheet emits a bundle that throws at load. the CSS module's factory is no longer in the module map, but the inlined startup still calls it

```
TypeError: e[249] is not a function
```

2.2.3 is fine. 2.2.4, 2.2.5 and 2.2.6 all show it. bisected by swapping only @rspack/core in the same install

what I think happens: since #14879 a stylesheet whose only incoming connection is the entry itself reports no JavaScript source type, so the JavaScript chunk renders no factory for it. the bootstrap still walks every entry module of the chunk and emits a call for each one. webpack guards that loop with `getModuleSourceTypes(entryModule).has("javascript")`, rspack does not

## Reproduce link

https://github.com/cezaraugusto/rspack-css-entry-startup

## Reproduce Steps

```bash
git clone https://github.com/cezaraugusto/rspack-css-entry-startup
cd rspack-css-entry-startup
npm install
npm test
```

the test builds the same two files with 2.2.3 and 2.2.6, prints both bundles and runs them. 2.2.3 runs clean, 2.2.6 throws

`src/plain.js`

```js
console.log("page")
```

`src/styles.css`

```css
body { color: red }
```

config

```js
{
  mode: "production",
  entry: { page: ["./src/plain.js", "./src/styles.css"] },
  experiments: { css: true },
  module: { rules: [{ test: /\.css$/, type: "css" }] },
}
```

## actual, 2.2.6

```js
(()=>{"use strict";var e={829(){console.log("page")}};e[829](),e[249]()})();
```

`page` prints, then `TypeError: e[249] is not a function`. 249 is the stylesheet module. `page.css` is emitted and correct

## expected, 2.2.3

```js
(()=>{"use strict";var r={249(r){r.exports={}},829(){console.log("page")}},e={};function o(t){...}o(829),o(249)})();
```

either the stylesheet keeps an empty factory, or the startup stops calling it

## notes

- same result with the stylesheet first in the array, and when the script also imports the CSS itself
- a single JS entry that only imports the CSS is fine on every version, so this is about the entry's import list
- the optimization options do not matter, the default config above is enough
- this reaches every Extension.js user, since an HTML page's scripts and linked stylesheets are one entry there. we pinned 2.2.3 for now
