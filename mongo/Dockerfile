FROM mongo:6-jammy

COPY ./keyfile /etc/keyfile/keyfile
RUN ["chmod","400","/etc/keyfile/keyfile"]
RUN ["chown","999:999", "/etc/keyfile/keyfile"]

CMD ["mongod"]