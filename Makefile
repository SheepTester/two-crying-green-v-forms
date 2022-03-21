# Recursive wildcard for nested directories (**/* only goes down one level)
# https://stackoverflow.com/a/12959764
rwildcard=$(wildcard $1$2) $(foreach d,$(wildcard $1*),$(call rwildcard,$d/,$2))

background_src := $(call rwildcard,src/background/,*.ts)
cs_src := $(filter-out $(background_src), $(call rwildcard,src/,*.ts) $(call rwildcard,src/,*.tsx))
css_src := $(call rwildcard,src/ui/style/,*.scss)

all: dist/content-script.js dist/background.js dist/content-style.css dist/page.css

dist/content-script.js: $(cs_src)
	bash ./scripts/build-cs.sh

dist/background.js: $(background_src)
	bash ./scripts/build-bg.sh

dist/content-style.css: $(css_src)
	sass ./src/ui/style/content-style.scss dist/content-style.css

dist/page.css: $(css_src)
	sass ./src/ui/style/page.scss dist/page.css
