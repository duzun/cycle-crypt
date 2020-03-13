// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import { module, main, unpkg } from './package.json';

// We have to load .babelrc explicitly and pass it as options to `rollup-plugin-babel`,
// otherwise it would not use our .babelrc for dependencies.
import require from 'require-json6';
const babelrc = require('./.babelrc');

export default {
    input: module,
    plugins: [
        resolve(),
        babel(babelrc), // convert to ES5
    ],
    output: [
        {
            file: main,
            name: 'cycleCrypt',
            format: 'umd',
            sourcemap: true,
        },
        {
            file: unpkg,
            name: 'cycleCrypt',
            format: 'umd',
            sourcemap: true,
            plugins: [
                terser(), // minify JS/ES
            ],
        },
    ]
};
