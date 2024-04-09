'use strict';

// Modules
const _ = require('lodash');
const path = require('path');

// Exports for lando install file
module.exports = {
  name: 'mailhog',
  config: {
    version: 'v1.0.1',
    supported: ['v1.0.0', 'v1.0.1'],
    confSrc: path.resolve(__dirname, '..', 'config'),
    hogfrom: [],
    port: '1025',
    sources: [],
  },
  parent: '_service',
  builder: (parent, config) => class LandoMailHog extends parent {
    constructor(id, options = {}) {
      // Merge user opts on top of defaults
      options = _.merge({}, config, options);
      // Build the default stuff here
      const hog = {
        image: `mailhog/mailhog:${config.version}`,
        user: 'root',
        environment: {
          TERM: 'xterm',
          MH_HOSTNAME: `${options.name}.mailhog.lando`,
          MH_API_BIND_ADDR: ':80',
          MH_UI_BIND_ADDR: ':80',
          LANDO_WEBROOT_USER: 'mailhog',
          LANDO_WEBROOT_GROUP: 'mailhog',
          LANDO_WEBROOT_UID: '1000',
          LANDO_WEBROOT_GID: '1000',
        },
        ports: ['80'],
        command: 'MailHog',
        networks: {
          default: {
            aliases: ['sendmailhog'],
          },
        },
      };
      // Change the "me" user
      options.meUser = 'mailhog';
      // Add in hogfrom info
      options.info = {hogfrom: options.hogfrom};
      // Mailhog needs to do some crazy shit on other services to work
      _.forEach(options.hogfrom, hog => {
        // Get download URL based on ARCH
        // const mhsendmailURL = (isArmed) ? arm64dlUrl : amd64dlUrl;
        // Add some build tazk
        require('../utils/add-build-step')(['/helpers/mailhog.sh'], options._app, hog, 'build_as_root_internal');
        // Set the hogfrom with some extra things
        options.sources.push({services: _.set({}, hog, {
          environment: {MH_SENDMAIL_SMTP_ADDR: 'sendmailhog:1025'},
          volumes: [`${options.confDest}/mailhog.ini:/usr/local/etc/php/conf.d/zzzz-lando-mailhog.ini`],
        })});
      });

      // Set the mailhpog
      options.sources.push({services: _.set({}, options.name, hog)});
      // Send it downstream
      super(id, options, ..._.flatten(options.sources));
    };
  },
};
