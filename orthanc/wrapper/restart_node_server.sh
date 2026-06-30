
#!/bin/bash

pod=$(sudo kubectl get pods -l "app=orthanc-wrapper" -n orthanc -o name)
sudo kubectl exec -n orthanc $pod -- bash -c "pm2 startOrRestart /node_data/app.json"
