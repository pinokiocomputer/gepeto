module.exports = {
  run: [{
    method: "shell.run",
    params: {
      message: [
        "git clone <GIT_REPOSITORY> app",
      ]
    }
  }, {
    method: "script.start",
    params: {
      uri: "torch.js",
      params: {
        path: "app",
        venv: "env",
//        xformers: true
      }
    }
  }, {
    method: "shell.run",
    params: {
      venv: "env",
      path: "app",
      message: [
        "pip install gradio",
        "pip install -r <INSTALL_FILE>"
      ]
    }
  }, {
    method: "fs.link",
    params: {
      venv: "app/env"
    }
  }, {
    method: "notify",
    params: {
      html: "Click the 'start' tab to get started!"
    }
  }]
}
