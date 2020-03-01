# NODE_RELEASE=13.x

all: test_all build

build:
	@npm run --silent build

test_all: test_php test_php_cli test_js test_js_cli

test_js:
	@npm run --silent test_js

test_php:
	@if [ -f ./vendor/bin/phpunit ]; then \
		php ./vendor/bin/phpunit ./test/; \
	else \
		@phpunit ./test/; \
	fi;

test_php_cli:
	@echo bin/cycry.php && \
		cp -f -- ./bin/cycry.php /tmp/cycry.pin && \
		cat /tmp/cycry.pin | ./bin/cycry.php -k 'p4$0rd5*' -so /tmp/cycry.psalt > /tmp/cycry.pout && \
		! diff -s /tmp/cycry.pin /tmp/cycry.pout && \
		[ -s /tmp/cycry.psalt ] && \
		cat /tmp/cycry.psalt | ./bin/cycry.php -k 'p4$0rd5*' -si - -i /tmp/cycry.pout -o /tmp/cycry.pdec && \
		diff -q /tmp/cycry.pin /tmp/cycry.pdec && \
		echo success && rm -f -- /tmp/cycry.p* && echo;

test_js_cli:
	@if [ -n "$(NODE_RELEASE)" ] || hash node; then \
		echo bin/cycry.js && \
		cp -f -- ./bin/cycry.js /tmp/cycry.jin && \
		cat /tmp/cycry.jin | ./bin/cycry.js -k 'p4$0rd5*' -so /tmp/cycry.jsalt > /tmp/cycry.jout && \
		! diff -s /tmp/cycry.jin /tmp/cycry.jout && \
		[ -s /tmp/cycry.jsalt ] && \
		./bin/cycry.js -k 'p4$0rd5*' -si /tmp/cycry.jsalt -i /tmp/cycry.jout -o /tmp/cycry.jdec && \
		diff -q /tmp/cycry.jin /tmp/cycry.jdec && \
		cat /tmp/cycry.jsalt | ./bin/cycry.js -k 'p4$0rd5*' -si - -so /tmp/cycry.jsalt1 -i /tmp/cycry.jout > /tmp/cycry.jdec && \
		diff -q /tmp/cycry.jin /tmp/cycry.jdec && \
		diff -q /tmp/cycry.jsalt1 /tmp/cycry.jsalt && \
		echo success && rm -f -- /tmp/cycry.j* && echo; \
	fi

speed_report:
	@(cd ./test && \
		. ./util.sh && cpu_model && \
		echo && \
		echo 'JS' && \
		./speed.sh js && \
		echo && \
		echo 'PHP' && \
		./speed.sh php 5000000 \
	) | tee test/speed.txt

# See https://www.fourmilab.ch/random/
ent_test:
	test/ent-test.sh js

# Use a bad key of 128 bits
dieharder_js:
	@cat /dev/zero \
		| ./bin/cycry.js -k 0x0123456789ABCDEFFEDCBA9876543210 -so /dev/null \
		| dieharder -a -g 200

# Use a bad key of 128 bits
# Note: PHP CLI is ~10x slower than Node.js :(
# 		This test could run hours or days, so better run the dieharder_js version
dieharder_php:
	@cat /dev/zero \
		| php bin/cycry.php -k 0x0123456789ABCDEFFEDCBA9876543210 -so /dev/null \
		| dieharder -a -g 200

# Warning! testu01_gateway doesn't work for some reason, can't pipe data in :(
# See https://github.com/blep/testu01_gateway
# Use a bad key of 128 bits
testu01:
	@docker run --rm -v "`pwd`/vendor/bin:/tmp/cp" --entrypoint="bash" blep/testu01:latest -c 'cp /root/testu01_gateway /tmp/cp/' && \
	cat /dev/zero \
		| php bin/cycry.php -k 0x0123456789ABCDEFFEDCBA9876543210 -so /dev/null \
		| ./vendor/bin/testu01_gateway --small-crush

install_node:
	@if [ -n "$(NODE_RELEASE)" ]; then \
		echo "node $(NODE_RELEASE)"; \
		sudo rm -rf -- "$(HOME)/.nvm" && \
		curl -sL "https://deb.nodesource.com/setup_$(NODE_RELEASE)" | sudo -E bash - && \
		sudo apt-get install -y nodejs && \
		command -v npx || npm i -g npx; \
	fi

npm_install:
	@if [ -n "$(NODE_RELEASE)" ] || hash npm; then \
		npm i; \
	fi

coverage_js:
	@if [ -n "$(NODE_RELEASE)" ] || hash npm; then \
		[ -s node_modules ] || npm i; \
		npm run coverage; \
	fi

codecov:
	@if [ -n "$(NODE_RELEASE)" ] || hash npx; then \
		npx codecov; \
	fi
