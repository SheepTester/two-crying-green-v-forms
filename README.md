<img src="./images/icon.svg" width="64" align="right" />

# Two Crying Green V Forms

A browser extension to resurrect the legacy of [Triton Dine][triton-dine], named after the [giraffe catchers][giraffe-catchers].

[triton-dine]: https://tritondine.jacksheridan.com/
[giraffe-catchers]: https://stuartcollection.ucsd.edu/artist/irwin.html

![Screenshot of the extension's Dining Dollar analysis page][graph]

[graph]: ./docs/images/scrape-graph.png

Currently, the extension can scrape your transaction history and display it as an interactive graph or export it as a CSV. In the future, I would like to add:

- Predictions for when you'll run out of dining dollars
- Recommended spending per day

Potential data analysis dashboards: (can select between all days/weekend/weekdays and mean/median)

- A graph of average spending per day of the week
- Maybe the time of day when money is spent?

## Development

You'll need [Deno][deno] and [Nodemon][nodemon] (for which you'll probably need [Node][node]).

[deno]: https://deno.land/manual/getting_started/installation
[nodemon]: https://www.npmjs.com/package/nodemon#Installation
[node]: https://nodejs.org/en/

```sh
# Build once
$ make

# Watch for changes and rebuild (still need to reload extension manually)
$ ./scripts/watch.sh
```

To reload the extension in Chrome, go to chrome://extensions/
