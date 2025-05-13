#!/usr/bin/env node
// 1. npx gepeto <name> <git url>: external git
// 2. npx gepeto <name>: no external git
const fs = require('fs')
const path = require('path')
const { pipeline } = require('stream');
const { promisify } = require('util');
const { bold, green } = require('kleur');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const prompts = require('prompts');
const git = require('isomorphic-git');
const add = async (type, argv) => {
  console.log("add", type, argv)
  let pinokio_meta = path.resolve(process.cwd(), "pinokio_meta.json")
  let meta
  try {
    meta = require(pinokio_meta)
  } catch (e) {
    meta = {}
  }
  delete argv._
  for(let key in argv) {
    if (key.startsWith("$")) {
      delete argv[key]
    }
  }
  if (type === "link") {
    if (argv.value && argv.value.length > 0) {
      if (meta.links) {
        if (Array.isArray(meta.links)) {
          meta.links = meta.links.concat(argv)
        } else {
          meta.links = [argv]
        }
      } else {
        meta.links = [argv]
      }
    }
  }
  if (type === "post") {
    if (meta.posts) {
      if (argv.value) {
        if (Array.isArray(meta.posts)) {
          meta.posts = meta.posts.concat(argv.value)
        } else {
          meta.posts = [argv.value]
        }
      }
    } else {
      if (argv.value) {
        meta.posts = [argv.value]
      }
    }
  }
  let str = JSON.stringify(meta, null, 2)
  console.log({ str })
  fs.writeFileSync(pinokio_meta, str)
}

const bootstrap = async (argv) => {
  let response
  if (argv.name) {
    response = {
      name: decodeURIComponent(argv.name),
      git: (argv.git ? decodeURIComponent(argv.git) : ""),
      icon: (argv.icon ? decodeURIComponent(argv.icon) : ""),
      install: (argv.install ? decodeURIComponent(argv.install) : "requirements.txt"),
      start: (argv.start ? decodeURIComponent(argv.start) : "app.py"),
    }
  } else {
    response = await prompts([{
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
    }, {
      type: 'text',
      name: 'start',
      message: '',
      initial: "app.py",
      onRender(kleur) {
        this.msg = `${kleur.green('App python file')} (Leave empty to use the default)`
      }
    }, {
      type: 'text',
      name: 'install',
      message: '',
      initial: "requirements.txt",
      onRender(kleur) {
        this.msg = `${kleur.green('PIP install file')} (Leave empty to use the default)`
      }
    }]);
  }

  let url = response.git.trim().length > 0 ? response.git.trim() : null
  let name = response.name
  let template = (url ? "templates/1" : "templates/2")

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

    let pinokio_meta = path.resolve(dest, "pinokio_meta.json")
    let str2 = JSON.stringify({
      links: [],
      posts: []
    }, null, 2)
    fs.writeFileSync(pinokio_meta, str2)
  }

  // 4. replace <INSTALL_FILE> with response.install
  let installFile = path.resolve(dest, "install.js")
  let install_str = fs.readFileSync(installFile, "utf8")
  install_str = install_str.replaceAll("<INSTALL_FILE>", response.install)
  fs.writeFileSync(installFile, install_str)

  // 5. replace <START_FILE> with response.start
  let startFile = path.resolve(dest, "start.js")
  let start_str = fs.readFileSync(startFile, "utf8")
  start_str = start_str.replaceAll("<START_FILE>", response.start)
  fs.writeFileSync(startFile, start_str)

  // If url doesn't exist => means start fresh, so create those files
  // if url exists => assume the files exist in the cloned repo
  if (!url) {
    // 6, if url does not exist, it's template/2 => create an empty start file and install file
    let requirementsFile = path.resolve(dest, response.install)
    await fs.promises.rename(path.resolve(dest, "requirements.txt"), requirementsFile)

    let appFile = path.resolve(dest, response.start)
    await fs.promises.rename(path.resolve(dest, "app.py"), appFile)
  }

  // 7. icon handling
  let icon
  if (response.icon) {
    const streamPipeline = promisify(pipeline);
    const res = await fetch(response.icon);
    if (!res.ok) {
      throw new Error(`unexpected response ${res.statusText}`);
    }
    const contentType = res.headers.get('content-type');
    const extension = contentType.split('/')[1];
    icon = `icon.${extension}`
    const iconFile = path.resolve(dest, icon);
    await streamPipeline(res.body, fs.createWriteStream(iconFile));
  } else {
    icon = "icon.png"
  }
  let pinokioFile = path.resolve(dest, "pinokio.js")
  let str = fs.readFileSync(pinokioFile, "utf8")
  str = str.replaceAll("<ICON>", icon)
  fs.writeFileSync(pinokioFile, str)
  
  // Autogenerate README
  if (url) {
    let readme = `# ${name}

A pinokio script for ${url}

`
    const readmeFile = path.resolve(dest, "README.md")
    fs.writeFileSync(readmeFile, readme)
  }

  // 8. add .gitignore
  let gitIgnore = path.resolve(dest, ".gitignore")
  let gitIgnoreContent = [
    "node_modules",
    ".DS_Store",
    "ENVIRONMENT"
  ].join("\n")
  fs.writeFileSync(gitIgnore, gitIgnoreContent)

  // 9. git init
  await git.init({ fs, dir: dest })

  // 10. git add
  await git.add({ fs, dir: dest, filepath: '.' })

  // 11. git commit
  let sha = await git.commit({
    fs,
    dir: dest,
    author: { name: 'gepeto', email: 'gepeto@pinokio.computer', },
    message: 'init'
  })

  // 12. git branch main
  await git.branch({ fs, dir: dest, ref: 'main' })

}

(async () => {
  const argv = yargs(hideBin(process.argv)).parse();
  console.log({ argv })
  if (argv._ && argv._.length > 0) {
    if (argv._.length > 1 && argv._[0] === "add") {
      // type := "post"|"link"
      let type = argv._[1] 
      await add(type, argv)
    }
  } else {
    await bootstrap(argv)
  }
})();
