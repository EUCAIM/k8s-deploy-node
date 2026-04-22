# Deployment

## Configuration and preparations

You can make a private copy of the templates you want to adjust with your own passwords/secrets: 
```
cp 1-db-service.yaml 1-db-service.private.yaml
```

### Database
Create a random password for the database and replace the pattern `XXXXXX` in `1-db-service.private.yaml` with it.


## Deploy

Create a namespace: `kubectl create namespace clinical-data-sql-db`  
Create the persistent volumes: `kubectl apply -n clinical-data-sql-db -f 0-pvc.yaml`  
Create the database deployment and service: `kubectl apply -n clinical-data-sql-db -f 1-db-service.private.yaml`  
