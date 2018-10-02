const { S3 } = require('aws-sdk');
const apiVersions = require('../../apiVersions.json');
const { getS3UploadParameters, getS3MoveParameters } = require('./toolbox/action.tools');
const {
  getFilePathsFromDirectory,
  writeFileFromStream,
  getFileNameFromS3Key
} = require('./toolbox/file.tools');

function s3Wrapper({ accessKeyId, secretAccessKey, region }) {
  const s3 = new S3({
    apiVersion: apiVersions.S3,
    accessKeyId,
    secretAccessKey,
    region
  });

  // ---------------------------- API functions --------------------------- //
  async function listBuckets() {
    const { Buckets } = await s3.listBuckets().promise();
    return Buckets;
  }

  async function getBucket({ bucket, prefix = undefined } = {}) {
    if (!bucket) {
      rej(`getBucket() requires bucket property`);
    }
    const listParams = {
      Bucket: bucket,
      ...!!prefix && { Prefix: prefix },
    };
    const { Contents } = await s3.listObjects(listParams).promise();
    return Contents;
  }

  async function downloadS3File({ bucket, s3FileName, destinationFileName } = {}) {
    if (!bucket || !s3FileName || !destinationFileName) {
      rej(`downloadS3File() requires parameters properties`);
    }
    const getParams = {
      Bucket: bucket,
      Key: s3FileName
    };
    const readStream = s3.getObject(getParams).createReadStream();
    await writeFileFromStream(readStream, destinationFileName);
  }

  async function uploadS3Directory({ bucket, s3Location, sourceDirectory, options={} } = {}) {
    if (!bucket || (s3Location === undefined || s3Location === null) || !sourceDirectory) {
      throw new Error(`uploadS3Directory() requires parameters properties: bucket, s3Location, and sourceDirectory`);
    } else {
      const excludeFiles = options.exclude || [];
      const filePathsArr = getFilePathsFromDirectory(sourceDirectory, excludeFiles);
      for (const filePath of filePathsArr) {
        // this allows the use of directory or directory/
        const slash = s3Location[s3Location.length - 1] === '/' ? '' : '/';
        const fullS3FilePath = `${s3Location}${slash}${filePath}`;
        const s3UploadOptions = getS3UploadParameters(bucket, fullS3FilePath, filePath, options);
        const waitInterval = options.throttleInterval || 100;
        await new Promise((res) => setTimeout(res, waitInterval));
        await s3.putObject(s3UploadOptions).promise();
        console.log(`${filePath} to ${fullS3FilePath}`);
      }
    }
  }

  async function uploadS3File({ bucket, s3FileName, sourceFileName, options={} } = {}) {
    if (!bucket || !s3FileName || !sourceFileName) {
      throw new Error(`uploadS3File() requires parameters properties: bucket, s3FileName, and sourceFileName`);
    } else {
      const s3UploadOptions = getS3UploadParameters(bucket, s3FileName, sourceFileName, options);
      const resp = await s3.putObject(s3UploadOptions).promise();
      return resp;
    }
  }

  async function moveS3Directory({ sourceBucket, s3SourceDirectory, destinationBucket, s3DestinationDirectory, options={} } = {}) {
    if (!sourceBucket || !s3SourceDirectory || !destinationBucket || (s3DestinationDirectory !== '' && !s3DestinationDirectory)) {
      throw new Error(`moveS3Directory() requires parameters: sourceBucket, s3SourceDirectory, destinationBucket, and s3DestinationDirectory`);
    } else {
      const listParams = {
        Bucket: sourceBucket,
        Prefix: s3SourceDirectory
      };
      const { Contents: keyObjects, IsTruncated } = await s3.listObjects(listParams).promise();
      if (IsTruncated) {
        const { Key: Marker } = keyObjects[keyObjects.length - 1];
        keyObjects = await fetchTruncatedS3Files({ keyObjects, params: listParams, Marker });
      }
      const excludedFiles = (!!options && options.exclude) ? options.exclude : [];
      const mappedKeys = keyObjects.map((k) => (k.Key)).filter((k) => !excludedFiles.includes(k));

      for (const key of mappedKeys) {
        const fileName = getFileNameFromS3Key(key);
        // this allows the use of directory or directory/
        const slash = s3DestinationDirectory[s3DestinationDirectory.length - 1] === '/' ? '' : '/';
        const newKey = (s3DestinationDirectory !== '' && s3DestinationDirectory !== '/') ? `${s3DestinationDirectory}${slash}${fileName}` : key;
        const moveParams = {
          sourceBucket,
          s3SourceFile: key,
          destinationBucket,
          s3DestinationFile: newKey,
          options
        };

        const waitInterval = options.throttleInterval || 100;
        await new Promise((res) => setTimeout(res, waitInterval));
        await moveS3File(moveParams);
        console.log(`s3://${sourceBucket}/${key} to s3://${destinationBucket}/${newKey}`);
      }
    }
  }

  async function moveS3File({ sourceBucket, s3SourceFile, destinationBucket, s3DestinationFile, options={} } = {}) {
    if (!sourceBucket || !s3SourceFile || !destinationBucket || !s3DestinationFile) {
      throw new Error(`moveS3File() requires parameters properties: sourceBucket, s3SourceFile, s3DestinationFile, and destinationBucket`);
    } else {
      const s3MoveOptions = getS3MoveParameters(sourceBucket, destinationBucket, s3SourceFile, s3DestinationFile, options);
      const resp = await s3.copyObject(s3MoveOptions).promise();

      // check for this to ensure the promise resolves before deleting
      if (!!resp) {
        const deleteParams = {
          Bucket: sourceBucket,
          Key: s3SourceFile
        };
        await s3.deleteObject(deleteParams).promise();
      }

      const newFileData = { newLocation: `s3://${destinationBucket}/${s3DestinationFile}` };
      return newFileData;
    }
  }


  async function copyS3Directory({ sourceBucket, s3SourceDirectory, destinationBucket, s3DestinationDirectory, options={} } = {}) {
    if (!sourceBucket || !s3SourceDirectory || !destinationBucket || (s3DestinationDirectory !== '' && !s3DestinationDirectory)) {
      throw new Error(`moveS3Directory() requires parameters: sourceBucket, s3SourceDirectory, destinationBucket, and s3DestinationDirectory`);
    } else {
      const listParams = {
        Bucket: sourceBucket,
        Prefix: s3SourceDirectory
      };
      let { Contents: keyObjects, IsTruncated } = await s3.listObjects(listParams).promise();
      if (IsTruncated) {
        const { Key: Marker } = keyObjects[keyObjects.length - 1];
        keyObjects = await fetchTruncatedS3Files({ keyObjects, params: listParams, Marker });
      }
      const excludedFiles = (!!options && options.exclude) ? options.exclude : [];
      const mappedKeys = keyObjects.map((k) => (k.Key)).filter((k) => !excludedFiles.includes(k));
      for (const key of mappedKeys) {
        const fileName = getFileNameFromS3Key(key);
        // this allows the use of directory or directory/
        const slash = s3DestinationDirectory[s3DestinationDirectory.length - 1] === '/' ? '' : '/';
        const newKey = (s3DestinationDirectory !== '' && s3DestinationDirectory !== '/') ? `${s3DestinationDirectory}${slash}${fileName}` : key;
        const copyParams = {
          sourceBucket,
          s3SourceFile: key,
          destinationBucket,
          s3DestinationFile: newKey,
          options
        };

        const waitInterval = options.throttleInterval || 100;
        await new Promise((res) => setTimeout(res, waitInterval));
        await copyS3File(copyParams);
        console.log(`s3://${sourceBucket}/${key} to s3://${destinationBucket}/${newKey}`);
      }
    }
  }

  async function copyS3File({ sourceBucket, s3SourceFile, destinationBucket, s3DestinationFile, options={} } = {}) {
    if (!sourceBucket || !s3SourceFile || !destinationBucket || !s3DestinationFile) {
      throw new Error(`moveS3File() requires parameters properties: sourceBucket, s3SourceFile, s3DestinationFile, and destinationBucket`);
    } else {
      const s3MoveOptions = getS3MoveParameters(sourceBucket, destinationBucket, s3SourceFile, s3DestinationFile, options);
      await s3.copyObject(s3MoveOptions).promise();
      const newFileData = { newLocation: `s3://${destinationBucket}/${s3DestinationFile}` };
      return newFileData;
    }
  }

  async function fetchTruncatedS3Files({ keyObjects, params, Marker, keyObjectsCumlative = [] } = {}) {
    const newParams = {...params, Marker };
    let keys = keyObjectsCumlative.length !== 0 ? keyObjectsCumlative : keyObjects;
    let { Contents: newKeys, IsTruncated } = await s3.listObjects(newParams).promise();
    keys = [...keys, ...newKeys];
    if (IsTruncated) {
      const { Key: newMarker } = newKeys[newKeys.length - 1];
      return fetchTruncatedS3Files({ params: newParams, Marker: newMarker, keyObjectsCumlative: keys });
    }
    return keys
  }

  // ------------------------ expose functions ------------------------- //
  this.listBuckets = listBuckets;
  this.getBucket = getBucket;
  this.downloadS3File = downloadS3File;
  this.uploadS3File = uploadS3File;
  this.uploadS3Directory = uploadS3Directory;
  this.moveS3File = moveS3File;
  this.moveS3Directory = moveS3Directory;
  this.copyS3Directory = copyS3Directory;
  this.copyS3File = copyS3File;
}

// ------------------------------- export ----------------------------- //
s3Wrapper.prototype = Object.create(s3Wrapper.prototype);
s3Wrapper.prototype.constructor = s3Wrapper;

module.exports = s3Wrapper;
