#!/usr/bin/env bash

####################################################################################################
## This is the user custom init script.
## It is executed on the initialization of the container when you select the image ubuntu-python 
## or any other based on this (including those used by the interactive applications like
## desktop-tensorflow or jupyter-tensorflow).

## You can include here any command for install/configure your apps or tools across any container
## that you deploy in the platform.

## Example 1: uncomment if you want to print the python version and the current date to show them
##            always at the beginning of the log of jobs you launch.
# python3 --version
# date -Iseconds

## Example 2: uncomment if you want to install some python package.
# pip install some-python-package

## Example 3: install some python package that you have in your persistent-home.
##            Note that the persistent-home will be mounted in all the containers and always in the 
##            same place, so you can take advantage of this to put there any package you need and 
##            is not in the images that you use.
##            You can upload the package to a remote desktop just doing drag-and-drop over the 
##            browser window when you are connected with Guacamole.
##            At the end of transfer it will be in the home directory of remote desktop and you
##            should move it into the persistent-home, e.g. to 
##            persistent-home/my-tools/somePackage-1.0.0.tar.gz
##            Finally uncomment the next line to install your package.
# pip install persistent-home/my-tools/somePackage-1.0.0.tar.gz

## Example 4: if you have many packages in a requirements.txt file, you can download all with 
##            "pip download -r requirements.txt", 
##            then move them (also the requirements file) to the persistent-home,
##            and finally uncomment the next line.
# pip install --no-index --find-links persistent-home/my-tools -r persistent-home/requirements.txt

## Example 5: there are some packages already uploaded in persistent-shared-folder/pypi.org, so if
#             you need one of them just uncomment one of the next lines and change the package at 
#             the end to install if you want.
# pip install --no-index --find-links persistent-shared-folder/pypi.org catboost
# pip install --no-index --find-links persistent-shared-folder/pypi.org lifelines
