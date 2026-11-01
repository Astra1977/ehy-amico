import {readdir,readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const files=['index.html','manifest.webmanifest'];for(const dir of ['js','css','assets','icons'])for(const file of (await readdir(dir)).sort())files.push(dir+'/'+file);
const hash=createHash('sha256');for(const file of files){hash.update(file);hash.update(await readFile(file))}const version=hash.digest('hex').slice(0,16);
const template=await readFile('scripts/sw.template.js','utf8');await writeFile('sw.js',template.replace('__VERSION__',version).replace('__ASSETS__',JSON.stringify(files)));console.log('Cache '+version+': '+files.length+' risorse');
