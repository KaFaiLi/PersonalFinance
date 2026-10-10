import {mkdir,rm,readFile,writeFile,copyFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const file of ['model','history'])await writeFile(`dist/${file}.js`,stripTypeScriptTypes(await readFile(`src/${file}.ts`,'utf8')));
for(const file of ['index.html','app.js','style.css','history-data.json'])await copyFile(`src/${file}`,`dist/${file}`);
console.log('Built static dist/ with local assets only.');
