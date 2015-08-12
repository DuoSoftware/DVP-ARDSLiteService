FROM ubuntu
RUN apt-get update
RUN apt-get install -y git nodejs npm
RUN git clone git://github.com/DuoSoftware/DVP-LimitHandler.git /usr/local/src/limithandler
RUN cd /usr/local/src/limithandler; npm install
CMD ["nodejs", "/usr/local/src/limithandler/app.js"]

EXPOSE 8815
