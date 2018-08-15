const fs = require('fs');

module.exports.convertFilePathToBuffer = function (filePath='') {
  const exists = fs.existsSync(filePath);

  if (!exists) {
    throw new Error(`Cannot find file: ${filePath}`);
  } else {
    return fs.readFileSync(filePath);
  }
};

module.exports.getFilePathsFromDirectory = function (directoryPath='') {
  const readRes = fs.readdirSync(directoryPath);
  const files = readRes.map((f) => {
    const fullPath = `${directoryPath}/${f}`;
    const isDir = fs.lstatSync(fullPath).isDirectory();
    if (isDir) {
      return getFilePathsFromDirectory(`${fullPath}`);
    } else {
      return fullPath;
    }
  });
  // flatten the array of arrays
  return [].concat.apply([], files);
};

module.exports.writeFileFromStream = function(readStream, destinationFilePath) {
  const writeStream = fs.createWriteStream(destinationFilePath);
  return new Promise((res, rej) => {
    readStream.pipe(writeStream);
    writeStream.on('error', rej);
    writeStream.on('finish', res);
  });
};
