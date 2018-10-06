const fs = require('fs');

module.exports.convertFilePathToBuffer = (filePath = '') => {
  const exists = fs.existsSync(filePath);

  if (!exists) {
    throw new Error(`Cannot find file: ${filePath}`);
  } else {
    return fs.readFileSync(filePath);
  }
};


module.exports.getFileNameFromS3Key = (key = '') => {
  const splitArr = key.split('/');
  const lastIdx = splitArr.length - 1;
  return (splitArr.length > 0) ? splitArr[lastIdx] : key;
};


module.exports.getFilePathsFromDirectory = (directoryPath = '', excludeFiles = []) => {
  const readRes = fs.readdirSync(directoryPath);
  const files = readRes.map((f) => {
    const fullPath = `${directoryPath}/${f}`;
    const isDir = fs.lstatSync(fullPath).isDirectory();
    if (isDir) {
      return this.getFilePathsFromDirectory(`${fullPath}`);
    }
    return fullPath;
  });

  const filtered = files.filter((f) => { return !excludeFiles.includes(f); });
  // flatten the array of arrays
  return [].concat.apply([], ...filtered);
};


module.exports.writeFileFromStream = (readStream, destinationFilePath) => {
  const writeStream = fs.createWriteStream(destinationFilePath);
  return new Promise((res, rej) => {
    readStream.pipe(writeStream);
    writeStream.on('error', rej);
    writeStream.on('finish', res);
  });
};
