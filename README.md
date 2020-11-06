# Exercism Repo Watch

Choose which Exercism repos to watch from the command-line!

## Requirements

- nodejs >= 14.0.0 (latest LTS recommended)

## Usage

### Global install

`npm install -g neenjaw-exercism-repo-watch-lite`

### Local install

`git clone https://github.com/neenjaw/exercism-repo-watch.git`

Then it can be used:

```shell
> GITHUB_TOKEN=<your personal access token> exercism-repo-watch-lite
```

### Command line usage

```text
> exercism-repo-watch-lite
exercism-repo-watch-lite

Modify your Exercism repo notification subscriptions

Commands:
  exercism-repo-watch                    Lookup and modify your subscriptions

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

## How does it work

Using your GitHub personal access token, performs a lookup of all Exercism repositories, then allows you to select which repositories you want to watch.
