.DEFAULT_GOAL := help

.PHONY: help check format lint test build-themes build-icons safari-build safari-build-ios safari-install safari-reinstall safari-status safari-doctor safari-unregister safari-open

help:
	@printf '%s\n' \
		'HN Refined development targets:' \
		'' \
		'  make check              Run all local validation and tests' \
		'  make format             Format JS, CSS, JSON, Markdown, HTML, and YAML' \
		'  make lint               Check formatting and lint rules without writing' \
		'  make test               Run the Node test suite only' \
		'  make build-themes       Rebuild generated theme CSS' \
		'  make build-icons        Regenerate app and extension icon PNGs' \
		'' \
		'  make safari-reinstall   Build, install, register, and open HN in Safari' \
		'  make safari-build       Build the signed local Safari host app' \
		'  make safari-build-ios   Build the iOS/iPadOS Safari host app' \
		'  make safari-install     Install and register the last built app' \
		'  make safari-status      Show signing, process, and extension state' \
		'  make safari-doctor      Run Safari workflow sanity checks' \
		'  make safari-unregister  Remove local HN Refined registrations' \
		'  make safari-open        Open Hacker News explicitly in Safari'

check:
	npm run check

format:
	npm run format

lint:
	npm run lint

test:
	npm test

build-themes:
	npm run build:themes

build-icons:
	npm run build:icons

safari-build:
	npm run safari:build

safari-build-ios:
	npm run safari:build:ios

safari-install:
	npm run safari:install

safari-reinstall:
	npm run safari:reinstall

safari-status:
	npm run safari:status

safari-doctor:
	npm run safari:doctor

safari-unregister:
	npm run safari:unregister

safari-open:
	npm run safari:open
