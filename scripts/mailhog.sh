#!/bin/bash

set -e
# Get the lando logger
. /helpers/log.sh

# Set the module
LANDO_MODULE="mailhog"

# Kick it off
lando_pink "Mailhog pre-run scripting"

# Grab curl if not installed
if ! command -v curl >& /dev/null; then apt-get install -y curl; fi;

# Check system type
ARCH=`uname -m`
if [[ "${ARCH}" = "aarch64" || "${ARCH}" = "arm" ]]
then
    /usr/bin/curl -fsSL -o /usr/local/bin/mhsendmail https://github.com/mailhog/MailHog/releases/tag/v1.0.1/MailHog_linux_arm
    lando_pink "Mailhog downloaded, ${ARCH}"
else
    /usr/bin/curl -fsSL -o /usr/local/bin/mhsendmail https://github.com/mailhog/MailHog/releases/tag/v1.0.1/MailHog_linux_amd64;
    lando_pink "Mailhog downloaded, ${ARCH}"
fi;

# Set up some new dirs
mkdir -p /var/www/certs
mkdir -p /srv/bindings
chown -R www-data:www-data /var/www/certs /srv/bindings

# Set up some symlnks
ln -sfn /var/www /srv/bindings/lando

ln -sfn /tmp /srv/bindings/lando/tmp
ln -sfn /app /srv/bindings/lando/code
ln -sfn /app /code

  # Do another chown pass
find /var/www -type d -exec chown www-data:www-data {} +
