export class ILogger {
  log(entry) {
    throw new Error('Not implemented');
  }
}

export class ConsoleLogger extends ILogger {
  log(entry) {
    // eslint-disable-next-line no-console
    console.log(`[${entry.timestamp}] [${entry.type}] [${entry.source}.${entry.function}] ${entry.message}`);
  }
}

export class FileLogger extends ILogger {
  constructor(fileName) {
    super();
    this.fileName = fileName;
    this.logs = [];
  }

  log(entry) {
    this.logs.push(entry);
    // Here you would implement file writing logic, e.g. using a backend API or browser download
  }

  getLogs() {
    return this.logs;
  }
}

export class LogManager {
  constructor() {
    this.logs = [];
    this.loggers = [];
  }

  addLogger(logger) {
    this.loggers.push(logger);
  }

  log(type, source, func, message) {
    const entry = {
      type,
      source,
      function: func,
      message,
      timestamp: new Date().toISOString()
    };
    this.logs.push(entry);
    this.loggers.forEach(logger => logger.log(entry));
  }

  logError(source, func, message) {
    this.log('Error', source, func, message);
  }

  logSuccess(source, func, message) {
    this.log('Info', source, func, message);
  }

  logWarning(source, func, message) {
    this.log('Warning', source, func, message);
  }

  logDebug(source, func, message) {
    this.log('Debug', source, func, message);
  }

  getLogs() {
    return [...this.logs];
  }
}
