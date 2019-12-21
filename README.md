# QueueGet
Download links from a queue file.

## Install
```
npm install queueget --global
```

## Example
Say you want to download a movie via some link and while it is loading you find another link you like. The point
of QueueGet is that you can just add new links to the queue file that it uses and it will keep on downloading. QueueGet 
has some convenience features around downloading, such as 
* Continuing broken downloads where they stopped
* Adapters for preprocessing links from file hosters
* IP refreshing when possible

## Usage
```
usage: qget [--help] [--queue QUEUE_FILE]

arguments:
  --help                show this help and exit
  --queue QUEUE_FILE    file with links queued for download (defaults to queue.txt)
```

Just run qget either direcly or daemonized.

## TODO

* run as daemon. can it kill previous daemons?
* configuration probably via env variables?
