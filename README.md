<img src="./images/icon.svg" width="64" align="right" />

# UCSD dining dollar tracker

A browser extension to resurrect the legacy of [Triton Dine][triton-dine].

[triton-dine]: https://tritondine.jacksheridan.com/
[giraffe-catchers]: https://stuartcollection.ucsd.edu/artist/irwin.html

![Screenshot of the extension's Dining Dollar analysis page][graph]

[graph]: ./docs/images/scrape-graph.png

Currently, the extension can scrape your transaction history and display it as an interactive graph or export it as a CSV. In the future, I would like to add:

- Predictions for when you'll run out of dining dollars
- Recommended spending per day

Potential data analysis dashboards: (can select between all days/weekend/weekdays and mean/median)

- A graph of average spending per each day of the week
- Number of transactions vs time of day
- Most used locations (bar chart)
- Average spending per day, week, quarter

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
