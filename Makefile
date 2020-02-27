# NODE_RELEASE=13.x

all: test_all build

build:
	@npm run --silent build

test_all: test_php test_js

test_js:
	@npm run --silent test_js

test_php:
	@if [ -f ./vendor/bin/phpunit ]; then \
		php ./vendor/bin/phpunit ./test/; \
	else \
		@phpunit ./test/; \
	fi;

test_php_cli:
	@cp -f -- ./bin/cycry.php /tmp/cycry.in && \
		./bin/cycry.php -k '********' -so /tmp/cycry.salt -i /tmp/cycry.in -o /tmp/cycry.out && \
		! diff -s /tmp/cycry.in /tmp/cycry.out && \
		[ -s /tmp/cycry.salt ] && \
		./bin/cycry.php -k '********' -si /tmp/cycry.salt -i /tmp/cycry.out -o /tmp/cycry.dec && \
		diff -q /tmp/cycry.in /tmp/cycry.dec && \
		echo success && rm -f -- /tmp/cycry.* || \
		echo fail

# See https://www.fourmilab.ch/random/
ent_test:
	test/ent-test.sh

dieharder_test:
	@cat /dev/zero | php bin/cycry.php -k 0x0123456789ABCDEFFEDCBA9876543210 | dieharder -a -g 200

install_node:
	@if [ -n "$(NODE_RELEASE)" ]; then \
		echo "node $(NODE_RELEASE)"; \
		sudo rm -rf -- "$(HOME)/.nvm" && \
		curl -sL "https://deb.nodesource.com/setup_$(NODE_RELEASE)" | sudo -E bash - && \
		sudo apt-get install -y nodejs && \
		command -v npx || npm i -g npx; \
	fi

npm_install:
	@if [ -n "$(NODE_RELEASE)" ]; then \
		npm i; \
	fi

coverage_js:
	@if [ -n "$(NODE_RELEASE)" ]; then \
		[ -s node_modules ] || npm i; \
		npm run coverage; \
	fi

codecov:
	@if [ -n "$(NODE_RELEASE)" ]; then npx codecov; fi
