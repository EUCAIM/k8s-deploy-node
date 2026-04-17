apiVersion: v1
kind: Secret
metadata:
  name: patient-id-encryption-key
  namespace: orthanc
type: Opaque
data:
  patient-id-encryption-key: <yoursecret>
