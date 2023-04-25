#!/bin/bash

######################################################################################
# Custom build operation for Jekyll 4 build and unsupported plugins (jekyll-scholar)
#
#####################################################################################
set -o errexit

SOURCE_DIRECTORY=${GITHUB_WORKSPACE}/$INPUT_SOURCE
DESTINATION_DIRECTORY=${GITHUB_WORKSPACE}/$INPUT_DESTINATION
# PAGES_GEM_HOME=$BUNDLE_APP_CONFIG
# GITHUB_PAGES=$PAGES_GEM_HOME/bin/github-pages

# Check if Gemfile's dependencies are satisfied or print a warning 
# if test -e "$SOURCE_DIRECTORY/Gemfile" && ! bundle check --dry-run --gemfile "$SOURCE_DIRECTORY/Gemfile" >/dev/null 2>&1; then
#   echo "::warning:: github-pages can't satisfy your Gemfile's dependencies."
# fi

# Set environment variables required by supported plugins
export JEKYLL_ENV="production"
export JEKYLL_GITHUB_TOKEN=$INPUT_TOKEN
export PAGES_REPO_NWO=$GITHUB_REPOSITORY
export JEKYLL_BUILD_REVISION=$INPUT_BUILD_REVISION

# Set verbose flag
if [ "$INPUT_VERBOSE" = 'true' ]; then
  VERBOSE='--verbose'
else
  VERBOSE=''
fi

# Set future flag
if [ "$INPUT_FUTURE" = 'true' ]; then
  FUTURE='--future'
else
  FUTURE=''
fi

# cd "$PAGES_GEM_HOME"
cd "$SOURCE_DIRECTORY"
bundle install
bundel exec jekyll build "$VERBOSE" "$FUTURE" --destination "$DESTINATION_DIRECTORY"
# $GITHUB_PAGES build "$VERBOSE" "$FUTURE" --source "$SOURCE_DIRECTORY" --destination "$DESTINATION_DIRECTORY"