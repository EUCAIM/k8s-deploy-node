FROM ubuntu:20.04
LABEL author="serlohu@upv.es"
LABEL maintainer="serlohu@upv.es"

ENV DEBIAN_FRONTEND noninteractive

# Update and install all the necessary packages for kubectl, ceph
RUN apt-get update && apt-get install -y apt-transport-https jq python3 python3-pip ceph-common curl gnupg
RUN pip3 install tpl
RUN curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg |  apt-key add -
RUN touch /etc/apt/sources.list.d/kubernetes.list 
RUN echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" |  tee -a /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update
RUN apt-get install -y kubectl 
RUN apt-get install -y vim linux-libc-dev 

COPY rootfs /home/ubuntu

WORKDIR /home/ubuntu
CMD [ "/home/ubuntu/run.sh" ]