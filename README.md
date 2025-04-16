# gepeto

A CLI tool for creating Pinokio applications.

## How to use

```
npx gepeto@latest
```

### CLI Parameters

You can use gepeto in interactive mode (with prompts) or by providing command-line parameters:

```
# Interactive mode
npx gepeto

# Using command-line parameters
npx gepeto --name=<name> [--git=<url>] [--icon=<url>] [--install=<file>] [--start=<file>]
```

#### Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--name` | Project name | Interactive prompt (default: "my-app") |
| `--git` | 3rd party git repository URL | Interactive prompt (empty by default) |
| `--icon` | Custom icon URL | Interactive prompt (uses default icon if empty) |
| `--install` | Custom pip install file | Interactive prompt (default: "requirements.txt") |
| `--start` | Custom app start file | Interactive prompt (default: "app.py") |

#### Examples

```bash
# Create a project with all parameters specified
npx gepeto --name=my-app --git=https://github.com/user/repo --icon=https://example.com/icon.png --install=requirements.txt --start=main.py

# Create a project with just a name and custom start file
npx gepeto --name=my-app --start=main.py

# Create a project from an external git repository
npx gepeto --name=my-app --git=https://github.com/user/repo
```

Docs: https://gepeto.pinokio.computer
