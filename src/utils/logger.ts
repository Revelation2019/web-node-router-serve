import Logger, { LogLevelString } from 'bunyan';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require(`${process.cwd()}/package.json`);

const level = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevelString;

const logger = Logger.createLogger({
  name: pkg.name,
  level,
});

export default logger;
