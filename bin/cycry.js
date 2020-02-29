#!/usr/bin/env node

/*jshint node: true*/

const fs = require('fs');

const CycleCryptStream = require('../stream');
const { CycleCrypt } = CycleCryptStream;
const { randomBytes } = CycleCrypt;

const argvAliases = {
    k: 'key',
    s: 'salt',
    so: 'salt-out',
    si: 'salt-in',
    i: 'in',
    o: 'out',
    h: 'help',
};

run();

function run() {
    const args = readArgv();
    if(args.help || !Object.keys(args).length ) {
        return usage();
    }

    let { key, salt } = args;

    const { stdin, stdout, stderr } = process;

    let $in = args['in'] || '-';
    $in = $in == '-' ? stdin : fs.createReadStream($in);

    let $out = args['out'] || '-';
    $out = $out == '-' ? stdout : fs.createWriteStream($out);

    if(key) {
        if(key.slice(0, 2) == '0x') {
            key = hex2buffer(key.slice(2));
        }
    }
    else {
        key = "\x00\x00\x00\x00";
    }

    let so = args['salt-out'];
    if(so) {
        so = so == '-' ? stdout : fs.createWriteStream(so);
    }

    if('salt' in args) {
        if(salt.slice(0, 2) == '0x') {
            salt = hex2buffer(salt.slice(2));
        }
    }
    else {
        let si = args['salt-in'];
        if(si) {
            si = si == '-' ? stdin : fs.createReadStream(si);
            return stream2buffer(si).then(pipe);
        }
        else {
            salt = randomBytes(key.length || 20);

            // Output the generated salt even when no explicit salt-out option
            if(!so) {
                so = $out === stdout ? stderr : stdout;
            }
        }
    }

    pipe(salt);

    function pipe(salt) {
        if(so) {
            if(so === stdout || so === stderr) {
                so.write("salt: 0x" + Buffer.from(salt).toString('hex')).end();
            }
            else {
                so.write(salt);
            }
        }

        const ccs = new CycleCryptStream({ key, salt });

        $in.pipe(ccs).pipe($out);

        if($in === stdin && $out === stdout) {
            $out.on('error', (error) => {
                if(error.code == 'EPIPE') {
                    // Ignore the error when the destination pipe closes
                    $in.unpipe(ccs);
                }
                else {
                    console.error(error);
                }
            });
        }
    }
}

function usage()
{
    const name = require('path').basename(process.argv[1], '.js');
    process.stdout.write(`
Usage:
    ${name} -k <key> [-s <salt> | -si <salt_in> | -so <salt_out>] [-i <file_in>] [-o <file_out>]
    ${name} -h|--help

    -h, --help      Show this help
    -k, --key       The encryption key. Could be hex if starts with '0x'.
    -s, --salt      Random bytes to be used as salt. Could be hex if starts with '0x'.
    -si, --salt-in  Filename or - from where to read the salt.
    -so, --salt-out Filename or - where to output the generated salt.
    -i, --in        Input file to encrypt or - for STDIN
    -o, --out       Output file or - for STDOUT

    You can not combine -s and -si, use just one of them.

    -i and -o default to -
`);
}

function hex2buffer(str) {
    let { length } = str;
    if(length & 1) {
        ++length;
        str += '0';
    }

    // Node.js
    return Buffer.from(str, 'hex');

    // Browser
    // let ret = new Uint8Array(length >> 1);
    // for(let i=0; i<length; i+=2) {
    //     ret[i>>1] = parseInt(str.slice(i, i+2), 16);
    // }
    // return ret;
}

function stream2buffer(stream) {
    const promise = new Promise((resolve, reject) => {
        let buf = [];
        stream.on('data', (chunk) => { buf.push(chunk); });
        stream.on('end', () => { resolve(Buffer.concat(buf)); });
        stream.on('error', reject);
    });
    return promise;
}

/// Read command line options
function readArgv() {
    const ret = {};
    let _a = null;
    process.argv.slice(2).forEach((v) => {
        if (v != '-' && v.slice(0,1) == '-') {
            if (_a != undefined && !(_a in ret)) {
                ret[_a] = true;
            }
            if (v.slice(0,2) == '--') {
                _a = v.slice(2);
            } else {
                let t = v.slice(1);
                _a = argvAliases[t] || t;
            }
        } else {
            ret[_a] = v;
        }
    });

    if (_a != undefined && !(_a in ret)) {
        ret[_a] = true;
    }

    return ret;
}
