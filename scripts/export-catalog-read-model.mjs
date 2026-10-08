// Export only the reviewed internal database projection; never promote drafts or
// leak historical venture scores into the user-facing record.
import {readFile,writeFile,rename} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {projectCatalog} from '../site/js/atlas-catalog.js';
export {projectCatalog};

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [input,output]=process.argv.slice(2);if(!input||!output)throw new Error('Expected database projection JSON and output JSON');
 const result=projectCatalog(JSON.parse(await readFile(input,'utf8')));
 const tmp=output+'.tmp';await writeFile(tmp,JSON.stringify(result));await rename(tmp,output);
 console.log('Exported '+result.entries.length+' active catalog records.');
}
