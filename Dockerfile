FROM ubuntu
RUN apt-get update
RUN apt-get install -y git nodejs npm
RUN git clone git://github.com/DuoSoftware/DVP-ARDSLiteService.git /usr/local/src/ardsliteservice
RUN cd /usr/local/src/ardsliteservice; npm install
CMD ["nodejs", "/usr/local/src/ardsliteservice/app.js"]

EXPOSE 8828
