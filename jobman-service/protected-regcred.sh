kubectl -n jobman-service-exec create secret docker-registry protected-regcred \
        --docker-server=harbor.eucaim-node.i3m.upv.es \
        --docker-username='robot$jobman-service' \
        --docker-password=XXXXXXXXXXXXXXXXXX
