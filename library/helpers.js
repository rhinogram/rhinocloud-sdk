
module.exports.debugLog = (...args) => {
  const {
    DEBUG = '',
    LOG_LEVEL = '',
  } = process.env;
  // boolean will get stringified in process.env for serverless and docker-compose
  if (DEBUG.toString() === 'true' || LOG_LEVEL.toLowerCase() === 'debug') {
    // eslint-disable-next-line
    console.log(...args);
  }
  return undefined;
};
