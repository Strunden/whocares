import test from 'node:test';
import assert from 'node:assert/strict';
import {readLogo} from './logo.js';
test('invalid logo identities never reach the database',async()=>{
 for(const id of ["x' OR true--",'../secret','', 'x'.repeat(82)])assert.equal(await readLogo({simpleQuery(){throw Error('unexpected SQL');}},id),null);
});
test('shared logo lookup preserves current catalog admission gates',async()=>{
 let query;
 assert.equal(await readLogo({async simpleQuery(q){query=q;return [{logo_b64:'aW1hZ2U='}];}},'company-arjo'),'aW1hZ2U=');
 for(const gate of ['c.visible','c.review_current','c.review_id IS NOT NULL',"c.decision IN ('retain','correct')"])assert.ok(query.includes(gate));
 assert.equal(await readLogo({async simpleQuery(){return [];}},'company-missing'),null);
});
