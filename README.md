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
* IP refreshing if possible

## Usage
```
usage: qget [<options>]

options:
  --queue FILE       links to download (defaults to queue.txt)
  --history FILE     links of the past (defaults to queue_history.txt)
  --restore FILE     links to restore before starting (debugging)
  --retries NUMBER   number of retries for failing downloads (defaults to 3)
  --router TYPE      router for ip refreshing (defaults to fritzbox)

```
