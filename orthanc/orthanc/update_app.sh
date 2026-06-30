#!/bin/sh

echo '1.----------> Deleting Old Bundle...'
sudo rm -rf bundle
echo '2.----------> Decompressing New Bundle...'
tar -xzf orthanc-wrapper.tar.gz
echo '3.----------> Installing nodejs packages...'
minikube kubectl -- exec -n orthanc deploy/orthanc-wrapper -- bash -c 'cd /node_data/bundle/programs/server;npm install'
echo '4.----------> Restarting Deployment...'
minikube kubectl -- rollout restart -n orthanc deployment orthanc-wrapper
