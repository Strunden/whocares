import assert from 'node:assert/strict';
import {get} from 'node:http';
const base='http://127.0.0.1:8788';
// Node fetch normalizes Host; use the raw HTTP client to test this boundary.
const hostileHost=await new Promise((resolve,reject)=>get(base,{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject));
assert.equal(hostileHost,403);
const response=await fetch(base+'/api/discovery');assert.equal(response.status,200);
const data=await response.json();assert.equal(data.schema_version,2);assert.ok(data.revision);
assert.ok(Array.isArray(data.catalog.entries)&&Array.isArray(data.graph.objects));
for(const [path,options,status] of [
 ['/',{headers:{Origin:'https://evil.example'}},403],
 ['/api/discovery',{method:'POST'},405],
 ['/.git/config',{},403],
 ['/api/unknown',{},404],
 ['/%2e%2e/package.json',{},404],
])assert.equal((await fetch(base+path,options)).status,status,path);
assert.match(await (await fetch(base+'/js/config.js')).text(),/http:\/\/127\.0\.0\.1:8788/);
console.log('Canonical API and seven private-preview boundary checks passed');
