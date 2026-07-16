#!/bin/sh

npm install pm2@latest -g

cd /node_data

if [ ! -d "bundle" ]; then
  tar -xzf orthanc-wrapper.tar.gz
fi

if [ -d "bundle/programs/server" ]; then
  cd bundle/programs/server
  npm install
  cd /node_data
fi

pm2-runtime app.json
