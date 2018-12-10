
module.exports.debugLog = (...args) => {
  // boolean will get stringified in process.env for serverless and docker-compose
  if (process.env.DEBUG.toString() === 'true') {
    // eslint-disable-next-line
    console.log(...args);
  }
  return undefined;
};
