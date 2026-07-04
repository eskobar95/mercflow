FROM alpine:3.21

RUN apk add --no-cache \
  postgresql16-client \
  rclone \
  dcron \
  bash \
  tzdata

COPY backup.sh /backup.sh
COPY crontab /etc/crontabs/root

RUN chmod +x /backup.sh

CMD ["crond", "-f", "-l", "2"]
