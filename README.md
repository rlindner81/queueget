# QueueGet
Download links from a queue file.

## Install
```
npm install queueget --global
```

## Example
Say you want to download a movie via some link and while it is loading you find another link you like. The point
of QueueGet is that you can just add new links to the queue file that it uses and it will keep on downloading. QueueGet 
has some convenience features, such as 
* Continuing broken downloads where they stopped if possible
* Loaders for preprocessing links from file hosters
* IP refreshing for supported routers (currently only Fritzbox)

```
# queue file with link at the top
queue.txt
http://www.mirrorservice.org/sites/releases.ubuntu.com/18.04.3/ubuntu-18.04.3-desktop-amd64.iso

qget

# link is being processed, so still at the top, additional links go below
queue.txt
http://www.mirrorservice.org/sites/releases.ubuntu.com/18.04.3/ubuntu-18.04.3-desktop-amd64.iso
http://www.mirrorservice.org/sites/releases.ubuntu.com/19.10/ubuntu-19.10-desktop-amd64.iso

# when processing finishes successfully, the topmost link is removed and further links are processed
```

## Usage
```
usage: qget [<options>]

options:
  --queue FILE       links to download (defaults to queue.txt)
  --history FILE     links of the past (defaults to queue_history.txt)
  --restore FILE     restore queue before starting for debugging
  --retries NUMBER   number of retries for failing downloads (defaults to 3)
  --router TYPE      router for ip refreshing, e.g. fritzbox

```

### Daemon
QueueGet has a daemon mode, where it just downloads the queue without blocking the shell you are using to start it. Use
`qgetd` to run this mode instead of `qget`. The output is written to `qget.txt` and the process id is written to 
`qget.pid`, this id is used to ensure only one instance of the daemon is running.
