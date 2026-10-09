import assert from 'node:assert/strict';
const base='http://127.0.0.1:8788';
const response=await fetch(base+'/api/discovery');assert.equal(response.status,200);
const data=await response.json();assert.equal(data.schema_version,2);assert.ok(data.revision);
assert.ok(Array.isArray(data.catalog.entries)&&Array.isArray(data.graph.objects));
for(const [path,options,status] of [
 ['/',{headers:{Host:'evil.example'}},403],
 ['/',{headers:{Origin:'https://evil.example'}},403],
 ['/api/discovery',{method:'POST'},405],
 ['/.git/config',{},403],
 ['/api/unknown',{},404],
 ['/%2e%2e/package.json',{},404],
])assert.equal((await fetch(base+path,options)).status,status,path);
assert.match(await (await fetch(base+'/js/config.js')).text(),/http:\/\/127\.0\.0\.1:8788/);
console.log('Canonical API and seven private-preview boundary checks passed');
