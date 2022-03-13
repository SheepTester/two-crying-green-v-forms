background_src := $(wildcard src/background/*.ts src/background/**/*.ts)
cs_src := $(filter-out $(background_src), $(wildcard src/*.ts src/*.tsx src/**/*.ts src/**/*.tsx))
css_src := $(wildcard src/ui/style/*.scss src/ui/style/**/*.scss)

all: dist/content-script.js dist/background.js dist/ui.css

dist/content-script.js: $(cs_src)
	bash ./scripts/build-cs.sh

dist/background.js: $(background_src)
	bash ./scripts/build-bg.sh

dist/ui.css: $(css_src)
	sass ./src/ui/style/index.scss dist/ui.css
