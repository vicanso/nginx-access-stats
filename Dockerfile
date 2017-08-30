FROM alpine

ADD ./nginx-access-stats /

CMD /nginx-access-stats