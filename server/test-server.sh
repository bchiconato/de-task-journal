#!/bin/bash
set -e

cd "$(dirname "$0")"

export GEMINI_API_KEY=""
export NOTION_API_KEY="mock-notion-key"
export CONFLUENCE_API_TOKEN="mock-confluence-token"
export CONFLUENCE_DOMAIN="test.atlassian.net"
export CONFLUENCE_USER_EMAIL="test@test.com"
export NODE_ENV="test"
export PORT="3001"

exec npx nodemon index.js