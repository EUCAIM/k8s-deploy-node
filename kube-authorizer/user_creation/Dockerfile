FROM ubuntu:22.04
LABEL author="serlohu@upv.es"
LABEL maintainer="serlohu@upv.es"

ENV DEBIAN_FRONTEND noninteractive

# First, install the required packages to add apt sources and public keys
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl gnupg ca-certificates && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
    
# Add kubernetes packages source (needed for kubectl package)
RUN curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg |  apt-key add -
RUN touch /etc/apt/sources.list.d/kubernetes.list 
RUN echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" |  tee -a /etc/apt/sources.list.d/kubernetes.list

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
            jq python3 python3-pip ceph-common kubectl linux-libc-dev apt-transport-https && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
    
RUN pip3 install --no-cache-dir tpl
    
COPY rootfs /home/ubuntu

WORKDIR /home/ubuntu
# CMD [ "/home/ubuntu/run.sh" ]
