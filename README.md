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

# Installation

I never bothered to publish the extension to the Chrome Web Store, so you'll have to install the extension manually.

To install the extension,

1. Download chromium-mv3.zip from the [Releases page](https://github.com/SheepTester/two-crying-green-v-forms/releases) and unzip it
2. Go to `chrome://extensions/` and enable Developer Mode
3. Click on "Load unpacked" and select the unzipped folder

To confirm that it works, click on the extension icon or visit [Dining Dollar Analysis](https://eacct-ucsd-sp.transactcampus.com/eAccounts/DiningDollarAnalysis.aspx). It should show a custom page that normally wouldn't exist without the extension. Click on the "Refresh" icon and wait a few minutes for it to scrape your transaction history.

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
