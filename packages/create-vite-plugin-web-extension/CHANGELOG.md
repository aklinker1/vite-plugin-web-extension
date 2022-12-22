# 2.0.0 (2022-12-22)


### Bug Fixes

* .tsx→.js replacement in manifest.json ([#33](https://github.com/aklinker1/vite-plugin-web-extension/issues/33)) ([3223d44](https://github.com/aklinker1/vite-plugin-web-extension/commit/3223d44455a1131ab08cdf0f6c83cf0cdba430ee))
* accept generated JS files as well ([#18](https://github.com/aklinker1/vite-plugin-web-extension/issues/18)) ([1bc1dac](https://github.com/aklinker1/vite-plugin-web-extension/commit/1bc1dac4a3fefadd78f9529357a28225e710851b))
* add ci and force a version bump ([01170bc](https://github.com/aklinker1/vite-plugin-web-extension/commit/01170bc0a34c9baa3eece2651ceb28ced02f5453))
* add docs ([04204c9](https://github.com/aklinker1/vite-plugin-web-extension/commit/04204c9e7a26828ce509c47cff3bc9050b8177cd))
* added MIT license ([14e3f45](https://github.com/aklinker1/vite-plugin-web-extension/commit/14e3f458c75c56985f86870ab8d9b4def388ec46))
* always use arrays for content_scripts.js ([cb2478e](https://github.com/aklinker1/vite-plugin-web-extension/commit/cb2478ed12ab74b19ad64c4029079c76b11b6f42))
* automatically set web-ext `target` when passing a browser ([b75921a](https://github.com/aklinker1/vite-plugin-web-extension/commit/b75921a404e6061c60ea37889bcdfd41a7dc8185))
* better error messaging for unsupported version validation ([6431822](https://github.com/aklinker1/vite-plugin-web-extension/commit/643182260853cb1e4a97e413c882829c3d2f990a))
* build content scripts correctly for vite v2.7 ([f13c08d](https://github.com/aklinker1/vite-plugin-web-extension/commit/f13c08da7b59154bc7b6dfa7db433f3692d6751e))
* change how sandbox pages are output ([3b02295](https://github.com/aklinker1/vite-plugin-web-extension/commit/3b0229545c5d4864d8ca7d546f4deddcbace91d2))
* compile assets instead of copying ([#21](https://github.com/aklinker1/vite-plugin-web-extension/issues/21)) ([e953818](https://github.com/aklinker1/vite-plugin-web-extension/commit/e953818aa1f7a14eb76be56f5c46faecbed1cf18))
* copy static assets in watch mode ([#17](https://github.com/aklinker1/vite-plugin-web-extension/issues/17)) ([7208865](https://github.com/aklinker1/vite-plugin-web-extension/commit/7208865964f39fbfa902258a4453133665f98b64))
* corrected peer dependency ([fec96fc](https://github.com/aklinker1/vite-plugin-web-extension/commit/fec96fc9dc0c0bb5d15b6ffe30ebf414049c168e))
* correctly handle `build.emptyOutDir` in watch mode ([a9642ce](https://github.com/aklinker1/vite-plugin-web-extension/commit/a9642ce62c6a4611a5a49e8479c78f52653bb885))
* deprecate `serviceWorkerType` and always build service worker in lib mode ([8ad5603](https://github.com/aklinker1/vite-plugin-web-extension/commit/8ad5603c05d04da8861852c7a4e89a71ce2887ab))
* don't build content scripts when there is a build failure ([57a2ef7](https://github.com/aklinker1/vite-plugin-web-extension/commit/57a2ef7d97e961de44fb764963e948403a6e7845))
* don't build the same input multiple times ([d4250f7](https://github.com/aklinker1/vite-plugin-web-extension/commit/d4250f7b4b061a88f6f7f64847c2967c4c14e87d))
* don't crash when there are no scripts ([1f564a4](https://github.com/aklinker1/vite-plugin-web-extension/commit/1f564a423648a3885b2283de90af3f1c5d84b52c))
* don't fail when there are no content scripts ([8c40fcb](https://github.com/aklinker1/vite-plugin-web-extension/commit/8c40fcb0bff32e8300cbb07cc9c532540982bd67))
* don't require permissions array for `vite dev` ([#26](https://github.com/aklinker1/vite-plugin-web-extension/issues/26)) ([f508a24](https://github.com/aklinker1/vite-plugin-web-extension/commit/f508a24ba8416782cae799884cd07f9036256492))
* generated: css content scripts were not being added to the final manifest ([e820b80](https://github.com/aklinker1/vite-plugin-web-extension/commit/e820b802ddd21ead726eb5c038a34f210a1ccb86))
* Handle nonexistant build output directory  ([#11](https://github.com/aklinker1/vite-plugin-web-extension/issues/11)) ([ced1e57](https://github.com/aklinker1/vite-plugin-web-extension/commit/ced1e57d544a38150c22215cf4e04a39e6754ffe))
* ignore `vite.config.ts` files for internal builds ([#57](https://github.com/aklinker1/vite-plugin-web-extension/issues/57)) ([5634451](https://github.com/aklinker1/vite-plugin-web-extension/commit/56344510b9131bccf2510ce1fb1d225def2c941a))
* improved logging ([ed1589b](https://github.com/aklinker1/vite-plugin-web-extension/commit/ed1589b9b228b35d018887fc3dbed9e59324f33a))
* include defined globals in content-scripts ([420eebf](https://github.com/aklinker1/vite-plugin-web-extension/commit/420eebfd2085075fa7487ff99391ed12943eb712))
* include more config for content scripts ([1694ab2](https://github.com/aklinker1/vite-plugin-web-extension/commit/1694ab2549f8087f7d6e0de2d27fcee38e8ec91a))
* include raw css from content scripts in manifest ([3a0cdfe](https://github.com/aklinker1/vite-plugin-web-extension/commit/3a0cdfefff052a41776de7784bf10b20ecd79ffe))
* log manifest alongside error ([3e9fc09](https://github.com/aklinker1/vite-plugin-web-extension/commit/3e9fc0987dc35c808957e884acd64eba1fdd5b6f))
* only build and watch content scripts once ([06487f2](https://github.com/aklinker1/vite-plugin-web-extension/commit/06487f25650c48298da572491b967ad743aa20d7))
* only empty out directory on first build in watch mode ([069c77e](https://github.com/aklinker1/vite-plugin-web-extension/commit/069c77e14d799318fd00b5bcabdd9fe3e532cc03))
* output script builds to "dist" when `build.outDir` is not specified ([1a27885](https://github.com/aklinker1/vite-plugin-web-extension/commit/1a2788571f92a4581b23efa5002038ffb673ae26))
* point homepage to docs ([8443987](https://github.com/aklinker1/vite-plugin-web-extension/commit/844398790ca0dcad48a4165187d0b6840d8eae99))
* prefix sandbox page scripts to /sandbox/ ([9906224](https://github.com/aklinker1/vite-plugin-web-extension/commit/9906224535c387e8cd020c015f73643371c1c65d))
* print all validation errors ([#53](https://github.com/aklinker1/vite-plugin-web-extension/issues/53)) ([374ff3e](https://github.com/aklinker1/vite-plugin-web-extension/commit/374ff3e0fff834a6ffdd2e6f334ff741556b4b85))
* remove debug log ([f4a7c2b](https://github.com/aklinker1/vite-plugin-web-extension/commit/f4a7c2bcedb9aec6db56dd49b8e607e0f5d74273))
* remove log ([8f350db](https://github.com/aklinker1/vite-plugin-web-extension/commit/8f350db068c18808279d77b3a20d9a941890febb))
* remove log ([6628f9b](https://github.com/aklinker1/vite-plugin-web-extension/commit/6628f9bec7648140eedf6e1d35dc766753df7816))
* remove logs ([ad16149](https://github.com/aklinker1/vite-plugin-web-extension/commit/ad161498f4fd462ceb758930b85fc43e378d28ea))
* remove terser defaults ([#28](https://github.com/aklinker1/vite-plugin-web-extension/issues/28)) ([d924260](https://github.com/aklinker1/vite-plugin-web-extension/commit/d92426090fd721a78a565e439d3052ebc4d388e2))
* respect browser option ([867ae16](https://github.com/aklinker1/vite-plugin-web-extension/commit/867ae163a0c5fca13ff15f4080988e21f2a9b770))
* support circular vite configs ([#35](https://github.com/aklinker1/vite-plugin-web-extension/issues/35)) ([f0d7c08](https://github.com/aklinker1/vite-plugin-web-extension/commit/f0d7c0827cc8b822f973e71afbfd2437bda3d382))
* support ESM projects ([#32](https://github.com/aklinker1/vite-plugin-web-extension/issues/32)) ([9375087](https://github.com/aklinker1/vite-plugin-web-extension/commit/93750875616e0b034960c12e431513e304917136))
* update keywords for NPM ([ca0b276](https://github.com/aklinker1/vite-plugin-web-extension/commit/ca0b2765fbfdeb8a08bad50c8e2d6453978f31e7))
* user a string instead of an array when there is only one script ([d7be838](https://github.com/aklinker1/vite-plugin-web-extension/commit/d7be838dcc622850370b5951f8b78b51144cd010))
* validate manifest before reading files to prevent errors ([6aafb2d](https://github.com/aklinker1/vite-plugin-web-extension/commit/6aafb2df5d8b4e5898917408381c7fed794216ad))
* verbose mode logs weren't always dim ([0e1a92f](https://github.com/aklinker1/vite-plugin-web-extension/commit/0e1a92fa5ba18101c538da422903c03dbdcd3e03))
* vite@3 peer dependency support ([5aac160](https://github.com/aklinker1/vite-plugin-web-extension/commit/5aac160494985d369b362c829134a983434e8136))
* wait for child script builds before reloading the extension ([ea943d0](https://github.com/aklinker1/vite-plugin-web-extension/commit/ea943d054d6df248eebe696605cadbd4b869f9b3))


### Features

* add a `skipAutoLaunch` option ([#12](https://github.com/aklinker1/vite-plugin-web-extension/issues/12)) ([a0174eb](https://github.com/aklinker1/vite-plugin-web-extension/commit/a0174eb96db5c0002a016a0fe70b0a738f4bf981))
* add manifest validation ([9e7473c](https://github.com/aklinker1/vite-plugin-web-extension/commit/9e7473ccfb54a0bf1083469b754440a89c3b98fb))
* allow building service worker in standalone build ([14f2965](https://github.com/aklinker1/vite-plugin-web-extension/commit/14f2965c5d01408f3b7e184ef2008d42c94f28f6))
* allow passing just the manifest path instead of a function ([ae14216](https://github.com/aklinker1/vite-plugin-web-extension/commit/ae142169a4efa856e893c7c84f37d168f388e72f))
* browser specific flags ([39f3ee5](https://github.com/aklinker1/vite-plugin-web-extension/commit/39f3ee5926f5fb78024a5de46fc4c14412079e83))
* build content scripts in lib mode ([dff41fa](https://github.com/aklinker1/vite-plugin-web-extension/commit/dff41fa77722272ec68d08a55c14d39c4224c2b3))
* build sandboxed pages as standalone pages ([6400474](https://github.com/aklinker1/vite-plugin-web-extension/commit/6400474512d656dfb3309143c8533791b5e40469))
* bundle css files generated files ([833fd2b](https://github.com/aklinker1/vite-plugin-web-extension/commit/833fd2bdb9d8968759b17f1558cde3079c82c1a4))
* chunk and include html additional inputs in initial build ([06fdc91](https://github.com/aklinker1/vite-plugin-web-extension/commit/06fdc911b767bf0d35a5139fb0ca973220ef5c7f))
* customize lib mode build config ([#25](https://github.com/aklinker1/vite-plugin-web-extension/issues/25)) ([6554860](https://github.com/aklinker1/vite-plugin-web-extension/commit/65548601c7e81a4232ddfcaf9f70b720e25904bf))
* html page hot-module-reloading (HMR) ([#14](https://github.com/aklinker1/vite-plugin-web-extension/issues/14)) ([cfab8be](https://github.com/aklinker1/vite-plugin-web-extension/commit/cfab8be61d42ddcf51108e1adb7b411c475191c3))
* include `options_page` as an input ([5c83f34](https://github.com/aklinker1/vite-plugin-web-extension/commit/5c83f34745ef01433bbc8bb2131527fa6387c38f))
* include manifest v3 fields as inputs (`background.service_worker`, `action.default_popup`) ([d7c8a1a](https://github.com/aklinker1/vite-plugin-web-extension/commit/d7c8a1a556d386bef2539eed03f38f302e357b69))
* production builds are working ([6dc6b91](https://github.com/aklinker1/vite-plugin-web-extension/commit/6dc6b91bae1de78c20c9c383bd30c5e773c67134))
* Support `.tsx` files as entrypoints ([#30](https://github.com/aklinker1/vite-plugin-web-extension/issues/30)) ([790d004](https://github.com/aklinker1/vite-plugin-web-extension/commit/790d004be63fae377dbc445d3bcbcb6161cacbbc))
* support manifest v3 validation ([4e584e1](https://github.com/aklinker1/vite-plugin-web-extension/commit/4e584e16740035279b3c9fe2f7be945efca9dddb))
* watch mode ([c1e41eb](https://github.com/aklinker1/vite-plugin-web-extension/commit/c1e41eb1e40ec5fdde55431ed7bab4b832eccfc1))


### BREAKING CHANGES

* all sandbox pages are now output to the `sandbox` directory, then their directory relative to the vite root



