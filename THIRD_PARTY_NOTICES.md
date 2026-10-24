# Third-party notices

The project’s proposed MIT license applies to original project code only. Dependencies and OCR assets retain the licenses and copyright notices below. MIT, ISC, BSD, and Apache-2.0 components can be distributed alongside MIT application code while retaining their notices and applicable conditions; they are not relicensed as MIT.

Package versions and license identifiers below were inspected in installed package metadata. The lockfile is the authoritative dependency graph. Preserve bundled notices in distributed static builds.

| Package | Version | Declared license | Preserved notices |
| --- | --- | --- | --- |
| ansi-regex | 5.0.1 | MIT | [license](docs/third-party/ansi-regex-license) |
| ansi-styles | 4.3.0 | MIT | [license](docs/third-party/ansi-styles-license) |
| bmp-js | 0.1.0 | MIT | [LICENSE](docs/third-party/bmp-js-LICENSE) |
| camelcase | 5.3.1 | MIT | [license](docs/third-party/camelcase-license) |
| cliui | 6.0.0 | ISC | [LICENSE.txt](docs/third-party/cliui-LICENSE.txt) |
| color-convert | 2.0.1 | MIT | [LICENSE](docs/third-party/color-convert-LICENSE) |
| color-name | 1.1.4 | MIT | [LICENSE](docs/third-party/color-name-LICENSE) |
| decamelize | 1.2.0 | MIT | [license](docs/third-party/decamelize-license) |
| dexie | 4.4.7 | Apache-2.0 | [LICENSE](docs/third-party/dexie-LICENSE), [NOTICE](docs/third-party/dexie-NOTICE) |
| dijkstrajs | 1.0.3 | MIT | [LICENSE.md](docs/third-party/dijkstrajs-LICENSE.md) |
| emoji-regex | 8.0.0 | MIT | [LICENSE-MIT.txt](docs/third-party/emoji-regex-LICENSE-MIT.txt) |
| find-up | 4.1.0 | MIT | [license](docs/third-party/find-up-license) |
| get-caller-file | 2.0.5 | ISC | [LICENSE.md](docs/third-party/get-caller-file-LICENSE.md) |
| idb-keyval | 6.3.0 | Apache-2.0 | [LICENCE](docs/third-party/idb-keyval-LICENCE) |
| is-fullwidth-code-point | 3.0.0 | MIT | [license](docs/third-party/is-fullwidth-code-point-license) |
| is-url | 1.2.4 | MIT | [LICENSE-MIT](docs/third-party/is-url-LICENSE-MIT) |
| locate-path | 5.0.0 | MIT | [license](docs/third-party/locate-path-license) |
| lucide-react | 1.61.0 | ISC | [LICENSE](docs/third-party/lucide-react-LICENSE) |
| node-fetch | 2.7.0 | MIT | [LICENSE.md](docs/third-party/node-fetch-LICENSE.md) |
| opencollective-postinstall | 2.0.3 | MIT | [LICENSE](docs/third-party/opencollective-postinstall-LICENSE) |
| p-limit | 2.3.0 | MIT | [license](docs/third-party/p-limit-license) |
| p-locate | 4.1.0 | MIT | [license](docs/third-party/p-locate-license) |
| p-try | 2.2.0 | MIT | [license](docs/third-party/p-try-license) |
| path-exists | 4.0.0 | MIT | [license](docs/third-party/path-exists-license) |
| pngjs | 5.0.0 | MIT | [LICENSE](docs/third-party/pngjs-LICENSE) |
| qrcode | 1.5.4 | MIT | [license](docs/third-party/qrcode-license) |
| react | 19.3.1 | MIT | [LICENSE](docs/third-party/react-LICENSE) |
| react-dom | 19.3.1 | MIT | [LICENSE](docs/third-party/react-dom-LICENSE) |
| regenerator-runtime | 0.13.11 | MIT | [LICENSE](docs/third-party/regenerator-runtime-LICENSE) |
| require-directory | 2.1.1 | MIT | [LICENSE](docs/third-party/require-directory-LICENSE) |
| require-main-filename | 2.0.0 | ISC | [LICENSE.txt](docs/third-party/require-main-filename-LICENSE.txt) |
| scheduler | 0.28.0 | MIT | [LICENSE](docs/third-party/scheduler-LICENSE) |
| set-blocking | 2.0.0 | ISC | [LICENSE.txt](docs/third-party/set-blocking-LICENSE.txt) |
| string-width | 4.2.3 | MIT | [license](docs/third-party/string-width-license) |
| strip-ansi | 6.0.1 | MIT | [license](docs/third-party/strip-ansi-license) |
| tesseract.js | 7.0.0 | Apache-2.0 | [LICENSE.md](docs/third-party/tesseract.js-LICENSE.md) |
| tesseract.js-core | 7.0.0 | Apache-2.0 | [LICENSE](docs/third-party/tesseract.js-core-LICENSE) |
| tr46 | 0.0.3 | MIT | See upstream package |
| wasm-feature-detect | 1.9.0 | Apache-2.0 | [LICENSE](docs/third-party/wasm-feature-detect-LICENSE) |
| webidl-conversions | 3.0.1 | BSD-2-Clause | [LICENSE.md](docs/third-party/webidl-conversions-LICENSE.md) |
| whatwg-url | 5.0.0 | MIT | [LICENSE.txt](docs/third-party/whatwg-url-LICENSE.txt) |
| which-module | 2.0.1 | ISC | [LICENSE](docs/third-party/which-module-LICENSE) |
| wrap-ansi | 6.2.0 | MIT | [license](docs/third-party/wrap-ansi-license) |
| y18n | 4.0.3 | ISC | [LICENSE](docs/third-party/y18n-LICENSE) |
| yargs | 15.4.1 | MIT | [LICENSE](docs/third-party/yargs-LICENSE) |
| yargs-parser | 18.1.3 | ISC | [LICENSE.txt](docs/third-party/yargs-parser-LICENSE.txt) |
| zlibjs | 0.3.1 | MIT | [LICENSE](docs/third-party/zlibjs-LICENSE) |

## OCR model assets

English (`eng`) and Myanmar (`mya`) models come from [tessdata_fast](https://github.com/tesseract-ocr/tessdata_fast/tree/87416418657359cb625c412a48b6e1d6d41c29bd), pinned to revision `87416418657359cb625c412a48b6e1d6d41c29bd`. Models use Apache-2.0. Setup preserves the upstream license as `public/ocr/TESSDATA-LICENSE`, alongside Tesseract.js and core licenses. Build-time gzip compression changes packaging, not the recognition model. The asset manifest records sizes and SHA-256 digests.

## Native OCR components

Tesseract.js core bundles native components. Their upstream notices are preserved in `docs/third-party/ocr-native/`; see its provenance index. Keep these alongside the browser assets when distributing. Lucide’s license also includes MIT notices for icons derived from Feather. No remote or bundled font is added by this project; the interface uses system fonts.

## Maintaining this inventory

When dependencies change, inspect installed package license/NOTICE files and the native core’s pinned upstream dependencies, update this inventory, and preserve notices in the deployment. Dev/build tools retain their package licenses in npm distributions. Confirm the project copyright holder before public release.
