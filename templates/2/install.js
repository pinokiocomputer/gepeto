module.exports = {
  run: [{
    method: "script.start",
    params: {
      uri: "torch.js",
      params: {
        venv: "env",
//        xformers: true
      }
    }
  }, {
    method: "shell.run",
    params: {
      venv: "env",
      message: [
        "pip install -r <INSTALL_FILE>"
      ],
    }
  }, {
    method: "fs.link",
    params: {
      venv: "env"
    }
  }, {
    method: "notify",
    params: {
      html: "Click the 'start' tab to get started!"
    }
  }]
}
