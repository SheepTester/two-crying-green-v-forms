<img src="./images/icon.svg" style="float: right; width: 32px;">

# Two Crying Green V Forms

A browser extension to resurrect the legacy of [Triton
Dine](https://tritondine.jacksheridan.com/), named after the [giraffe
catchers](https://stuartcollection.ucsd.edu/artist/irwin.html).

Currently, the extension can scrape your transaction history and display it as
an interactive graph or export it as a CSV. In the future, I would like to add:

- Predictions for when you'll run out of dining dollars
- Recommended spending per day

## Development

You'll need [Deno](https://deno.land/manual/getting_started/installation) and
[Nodemon](https://www.npmjs.com/package/nodemon#Installation) (for which you'll
probably need [Node](https://nodejs.org/en/)).

```sh
# Build once
$ make

# Watch for changes and rebuild (still need to reload extension manually)
$ ./scripts/watch.sh
```

To reload the extension in Chrome, go to chrome://extensions/
