# Exercism Repo Watch

Choose which Exercism repos to watch from the commandline!

## Requirements

- nodejs >= 14.0.0 (latest LTS recommended)

For the `atom/node-keytar` dependency, it currently requires for building:

- C++ compiler in path
- Python 3 in path

### WSL

- this currently doesn't work in WSL or headless environments due to an X11 forwarding issue

## Usage

### Global install

`npm install -g neenjaw-exercism-repo-watch`

### Local install

`git clone https://github.com/neenjaw/exercism-repo-watch.git`

Then it can be used:

```shell
> exercism-repo-watch
```

### Command line usage

```text
> exercism-repo-watch [command]
exercism-repo-watch

Modify your Exercism repo notification subscriptions

Commands:
  exercism-repo-watch                    Lookup and modify your subscriptions
  exercism-repo-watch get-token          Get your secret GitHub personal access token
  exercism-repo-watch remove-token       Remove your secret GitHub personal access token
  exercism-repo-watch set-token <token>  Set your secret GitHub personal access token

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

## How does it work

Using your GitHub personal access token, performs a lookup of all Exercism repositories, then allows you to select which repositories you want to watch. It uses native keychain via `atom/node-keytar`.
