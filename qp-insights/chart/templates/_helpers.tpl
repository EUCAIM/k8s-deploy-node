{{/* vim: set filetype=mustache: */}}

{{/* Print the volume definition to access datalake. */}}
{{- define "quibim-precision.datalakeVolumeDefinition" -}}
cephfs:
  monitors: 
{{- toYaml .Values.persistence.datalakeCephAccess.monitors | nindent 4 }}
  path: "{{ .Values.persistence.datalakeCephAccess.path }}"
  user: "{{ .Values.persistence.datalakeCephAccess.user }}"
  secretRef:
    name: quibimprecision-ceph-user-secret
  readOnly: false
{{- end -}}


{{/* Print the content of .Values.quibim as items for the env property of a container. */}}
{{- define "quibim-precision.quibimValuesAsEnvItems" -}}
{{- range $key, $value := $.Values.quibim }}
- name: {{ $key }}
  value: {{ $value | quote }}
{{- end }}
{{ include "quibim-precision.MongoURLAsEnvItem" . }}
{{- range $key, $secret := $.Values.quibimSecrets }}
- name: {{ $key }}
  valueFrom:
    secretKeyRef:
      name: quibim-secrets
      key: {{ $key | quote }}
{{- end }}
{{- end }}


{{/* Print the initContainer that waits for the DB readiness. */}}
{{- define "quibim-precision.initContainerWaitDB" -}}
initContainers:
- name: wait-for-db
  image: "{{ .Values.dockerhubRegistry }}library/mongo:{{ .Values.mongodb.imageTag }}"
  env:
{{ include "quibim-precision.MongoURLAsEnvItem" . | indent 4 }}
  command: 
    - '/bin/sh'
    - '-c'
    - >-
      until [ "$(mongosh "${MONGO_URL}" --quiet --eval 'db.projects.countDocuments()')" -gt "0" ]; do 
         echo Waiting for database initialized...; sleep 4; 
      done
{{- end -}}


{{/* Print the URL to access MongoDB. */}}
{{- define "quibim-precision.MongoURL" }}
{{- with .Values.mongodb }}
{{- printf "mongodb://%s:%s@mongodb:%s/%s?authSource=admin" .username .password (.port | toString) .db }}
{{- end }}
{{- end }}


{{/* Print the URL to access MongoDB as an item for the env property of a container. */}}
{{- define "quibim-precision.MongoURLAsEnvItem" -}}
- name: MONGO_URL
  valueFrom:
    secretKeyRef:
      name: quibim-secrets
      key: MONGO_URL
{{- end -}}


{{- define "getMongoPassword" }}
{{ .Values.quibimSecrets.MONGO_INITDB_ROOT_PASSWORD | default (randAlphaNum 24) }}
{{- end }}


{{/* Print the public URL to access to the app. */}}
{{- define "quibim-precision.AppURL" }}
{{- printf "https://%s" .Values.ingress.discoveryHost }}
{{- end }}


{{- define "imagePullSecret" }}
{{- with .Values.privateRegistryCredentials }}
{{- printf "{\"auths\": {\"%s\": {\"username\":\"%s\",\"password\":\"%s\",\"auth\": \"%s\"}}}" .registry .username .password (printf "%s:%s" .username .password | b64enc) | b64enc }}
{{- end }}
{{- end }}

{{- define "imagePullSecretForAnalysis" }}
{{- with .Values.privateRegistryCredentialsForAnalysis }}
{{- printf "{\"auths\": {\"%s\": {\"username\":\"%s\",\"password\":\"%s\",\"auth\": \"%s\"}}}" .registry .username .password (printf "%s:%s" .username .password | b64enc) | b64enc }}
{{- end }}
{{- end }}

