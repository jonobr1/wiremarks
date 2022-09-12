#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

# navigate into the build output directory
cd public

# if you are deploying to a custom domain
# echo 'two.js.org' > CNAME

git init
git add -A
git commit -m 'deploy'

git push -f git@github.com:jonobr1/wireframes.git master:gh-pages

cd -
