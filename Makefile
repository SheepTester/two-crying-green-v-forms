background_src := $(wildcard src/background/*.ts src/background/**/*.ts)
cs_src := $(filter-out $(background_src), $(wildcard src/*.ts src/*.tsx src/**/*.ts src/**/*.tsx))

all: dist/content-script.js dist/background.js

dist/content-script.js: $(cs_src)
	bash ./scripts/build-cs.sh

dist/background.js: $(background_src)
	bash ./scripts/build-bg.sh
