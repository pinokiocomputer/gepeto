#!/usr/bin/env node
// 1. npx gepeto <name> <git url>: external git
// 2. npx gepeto <name>: no external git
const fs = require('fs')
const path = require('path')
const { pipeline } = require('stream');
const { promisify } = require('util');
const { bold, green } = require('kleur');
const prompts = require('prompts');
//const args = process.argv.slice(2); // Skip first two arguments (node and script name)

(async () => {
  const response = await prompts([{
    type: 'text',
    initial: 'my-app',
    name: 'name',
    message: '',
    onRender(kleur) {
      this.msg = `${kleur.green('Project name')}`
    }
  }, {
    type: 'text',
    name: 'icon',
    message: '',
    onRender(kleur) {
      this.msg = `${kleur.green('Icon URL')} (Leave empty to use the default icon)`
    }
  }, {
    type: 'text',
    name: 'git',
    message: '',
    onRender(kleur) {
      this.msg = `${kleur.green('3rd party git URL')} (Leave empty if not using an external repository)`
    }
  }]);
  console.log(response)

  let url = response.git.trim().length > 0 ? response.git.trim() : null
  let name = response.name
  let template = (url ? "templates/1" : "templates/2")




//  let template
//  if (args.length > 0) {
//    name = args[0]
//    if (args.length > 1) {
//      url = args[1]
//      template = "templates/1"
//    } else {
//      template = "templates/2"
//    }
//  }

  // 1. copy common files
  let dest = path.resolve(process.cwd(), name)
  let src = path.resolve(__dirname, template)
  fs.cpSync(src, dest, { recursive: true })

  // 2. replace $GIT_REPOSITORY from install.js
  if (url) {
    let installFile = path.resolve(dest, "install.js")
    let str = fs.readFileSync(installFile, "utf8")
    str = str.replaceAll("<GIT_REPOSITORY>", url)
    fs.writeFileSync(installFile, str)
  }

  // 3. replace $TITLE from pinokio.js
  if (name) {
    let pinokioFile = path.resolve(dest, "pinokio.js")
    let str = fs.readFileSync(pinokioFile, "utf8")
    str = str.replaceAll("<TITLE>", name)
    fs.writeFileSync(pinokioFile, str)
  }


  // icon handling
  if (response.icon) {
    const streamPipeline = promisify(pipeline);
    const res = await fetch(response.icon);
    if (!res.ok) {
      throw new Error(`unexpected response ${res.statusText}`);
    }
    const contentType = res.headers.get('content-type');
    const extension = contentType.split('/')[1];
    const iconFile = path.resolve(dest, `icon.${extension}`);
    await streamPipeline(res.body, fs.createWriteStream(iconFile));
  }
})();



