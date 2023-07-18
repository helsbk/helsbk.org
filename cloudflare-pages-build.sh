#!/bin/bash

set -o errexit -o pipefail

ZOLA_VERSION=0.17.2
wget --quiet "https://github.com/getzola/zola/releases/download/v${ZOLA_VERSION}/zola-v${ZOLA_VERSION}-x86_64-unknown-linux-gnu.tar.gz"
tar xf "zola-v${ZOLA_VERSION}-x86_64-unknown-linux-gnu.tar.gz"
./zola build

find ./public -name 'index.html' -mindepth 2 -type f \
  -exec sh \
  -c 'parent="$(dirname "$1")"; mv "$1" "$parent/../$(basename "$parent").html";' \
  find-sh {} \;

find ./public -empty -type d -delete
