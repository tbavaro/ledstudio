#!/bin/sh

cd "$(dirname "$0")"

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     binary=fcserver-rpi;;
    Darwin*)    binary=fcserver-osx;;
    *)          echo "Can't identify system type: ${unameOut}" 1>&2; exit 1;;
esac
echo ${machine}

# restart in case it exits unexpectedly
while true; do
  ./${binary} ./fcserver.json

  # sleep in case there's some issue even starting it
  sleep 0.1
done
