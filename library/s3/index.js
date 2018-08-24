const { S3 } = require('aws-sdk');
const apiVersions = require('../../apiVersions.json');
const { getS3UploadParameters, getS3MoveParameters } = require('./toolbox/action.tools');
const { getFilePathsFromDirectory, writeFileFromStream } = require('./toolbox/file.tools');

function s3Wrapper() {
  const s3 = new S3({ apiVersion: apiVersions.S3 });

  // ---------------------------- API functions --------------------------- //
  async function listBuckets() {
    const { Buckets } = await s3.listBuckets().promise();
    return Buckets;
  }

  async function getBucket(bucket='') {
    const listParams = { Bucket: bucket };
    const { Contents } = await s3.listObjects(listParams).promise();
    return Contents;
  }

  async function downloadS3File({ bucket, s3FileName, destinationFileName }) {
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

  async function uploadS3Directory({ bucket, s3Location, sourceDirectory, options }) {
    if (!bucket || (s3Location === undefined || s3Location === null) || !sourceDirectory) {
      throw new Error(`uploadS3Directory() requires parameters properties: bucket, s3Location, and sourceDirectory`);
    } else {
      const filePathsArr = getFilePathsFromDirectory(sourceDirectory);
      for (const filePath of filePathsArr) {
        const fullS3FilePath = `${s3Location}${filePath}`;
        const s3UploadOptions = getS3UploadParameters(bucket, fullS3FilePath, filePath, options);
        await s3.putObject(s3UploadOptions).promise();
      }
    }
  }

  async function uploadS3File({ bucket, s3FileName, sourceFileName, options }) {
    if (!bucket || !s3FileName || !sourceFileName) {
      throw new Error(`uploadS3File() requires parameters properties: bucket, s3FileName, and sourceFileName`);
    } else {
      const s3UploadOptions = getS3UploadParameters(bucket, s3FileName, sourceFileName, options);
      const resp = await s3.putObject(s3UploadOptions).promise();
      return resp;
    }
  }

  async function moveS3Directory({ sourceBucket, s3SourceDirectory, destinationBucket, s3DestinationDirectory, options }) {
    if (!sourceBucket || !s3SourceDirectory || !destinationBucket || !s3DestinationDirectory) {
      throw new Error(`moveS3Directory() requires parameters: sourceBucket, s3SourceDirectory, destinationBucket, and s3DestinationDirectory`);
    } else {
      const listParams = {
        Bucket: sourceBucket,
        Prefix: s3SourceDirectory
      };
      const { Contents:keyObjects } = await s3.listObjects(listParams).promise();
      const excludedFiles = (!!options && options.exclude) ? options.exclude : [];
      const mappedKeys = keyObjects.map((k) => (k.Key)).filter((k) => !excludedFiles.includes(k));
      
      for (const key of mappedKeys) {
        const newKey = (s3DestinationDirectory !== '' && s3DestinationDirectory !== '/') ? `${s3DestinationDirectory}${key}` : key;
        const moveParams = {
          sourceBucket,
          s3SourceFile: key,
          destinationBucket,
          s3DestinationFile: newKey,
          options
        };
        await moveS3File(moveParams);
      }
    }
  }

  async function moveS3File({ sourceBucket, s3SourceFile, destinationBucket, s3DestinationFile, options }) {
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

  // ------------------------ expose functions ------------------------- //
  this.listBuckets = listBuckets;
  this.getBucket = getBucket;
  this.downloadS3File = downloadS3File;
  this.uploadS3File = uploadS3File;
  this.uploadS3Directory = uploadS3Directory;
  this.moveS3File = moveS3File;
  this.moveS3Directory = moveS3Directory;
}

// ------------------------------- export ----------------------------- //
s3Wrapper.prototype = Object.create(s3Wrapper.prototype);
s3Wrapper.prototype.constructor = s3Wrapper;

module.exports = s3Wrapper;
