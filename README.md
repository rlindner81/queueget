# QueueGet

[![npm version](https://img.shields.io/npm/v/queueget)](https://www.npmjs.com/package/queueget)
[![monthly downloads](https://img.shields.io/npm/dm/queueget)](https://www.npmjs.com/package/queueget)
[![CI Main](https://github.com/rlindner81/queueget/actions/workflows/ci-main.yml/badge.svg)](https://github.com/rlindner81/queueget/commits/main)

Download links from a queue file.

## Use via npx

```
npx queueget --help
```

## Example

Say you want to download a movie via some link and while it is loading you find another link you like. The point
of QueueGet is that you can just add new links to the queue file that it uses and it will keep on downloading. QueueGet
has some convenience features, such as

- Continuing broken downloads where they stopped if possible
- Loaders for preprocessing links from file hosters
- IP refreshing for supported routers (currently only Fritzbox)

```
# queue file with link at the top
echo 'http://www.mirrorservice.org/sites/releases.ubuntu.com/18.04.3/ubuntu-18.04.3-desktop-amd64.iso' > queue.txt

# run queueget
npx queueget

# link is being processed, so still at the top, additional links go below
echo 'http://www.mirrorservice.org/sites/releases.ubuntu.com/19.10/ubuntu-19.10-desktop-amd64.iso' >> queue.txt

# when processing finishes successfully, the topmost link is removed and further links are processed
```

## Usage

```
usage: queueget [<options>]

options:
  --queue FILE       links to download (defaults to queue.txt)
  --history FILE     links of the past (defaults to queue_history.txt)
  --restore FILE     restore queue before starting for debugging
  --retries NUMBER   number of retries for failing downloads (defaults to 3)
  --limit NUMBER     bytes per second limit for download (defaults to 0, no limit)
  --router TYPE      router for ip refreshing, e.g. fritzbox
  --flatten          ignore directories

```

### Daemon

QueueGet has a daemon mode, where it just downloads the queue without blocking the shell you are using to start it. Use
`queuegetd` to run this mode instead of `queueget`. The output is written to `queueget.txt` and the process id is 
written to `queueget.pid`, this id is used to ensure only one instance of the daemon is running.
