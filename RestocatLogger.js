'use strict';

const log4js = require('log4js');

class RestocatLogger {

  static register(locator) {
    const logger = new RestocatLogger(locator);
    locator.registerInstance('logger', logger);
    return logger;
  }

  constructor(locator) {
    this.events = locator.resolve('events');
    this.loggerRequest = log4js.getLogger('REQUEST ');
    this.loggerResponse = log4js.getLogger('RESPONSE');
    this.loggerSystem = log4js.getLogger('SYSTEM  ');

    ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach(name => {
      this[name] = (...arg) => this.systemLogger(name, ...arg);
    });

    this.listen();
  }

  systemLogger(level, ...arg) {
    this.loggerSystem[level](...arg);
  }

  listen() {
    process.on('uncaughtException', error => this.loggerSystem.fatal(error));

    this.events.on('incomingMessage', request => this.loggerRequest.info(`${request.method} ${request.url}`));
    this.events.on('responseServer', (response, request) => {
      const leftTime = Date.now() - request.getTime();
      const method = request.method;
      const url = request.getLocation();
      const remoteAddr = request.getRemoteAddr();

      this.loggerResponse.info(`${remoteAddr} - - (${leftTime}ms) ${method} ${url} ${response}`)
    });

    this.events.on('warn', msg => this.loggerSystem.warn(msg));
    this.events.on('error', msg => this.loggerSystem.error(msg));
    this.events.on('fatal', msg => this.loggerSystem.fatal(msg));
    this.events.on('info', msg => this.loggerSystem.info(msg));
    this.events.on('trace', msg => this.loggerSystem.trace(msg));
    this.events.on('debug', msg => this.loggerSystem.debug(msg));
    this.events.on('collectionFound', descriptor => this.loggerSystem.info(`Collection ${descriptor.name} found`));
    this.events.on('collectionLoaded', descriptor => this.loggerSystem.info(`Collection ${descriptor.name} loaded`));
    this.events.on('allCollectionsLoaded', descriptor => this.loggerSystem.info('All collections loaded'));
    this.events.on('forwarding', msg => this.loggerSystem.info(msg));

  }
}

module.exports = RestocatLogger;
