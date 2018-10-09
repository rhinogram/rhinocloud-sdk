
module.exports.debugLog = (...args) => {
  if (process.env.DEBUG === true) {
    console.log(...args);
  }
  return undefined;
};
