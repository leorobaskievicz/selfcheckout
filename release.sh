#!/bin/bash

# Pular se houver erros
set -e

git checkout master && git merge develop && git push origin master && git checkout develop

# Criar a release no GitHub
gh release create $2 --title "$3" --notes "$4"
