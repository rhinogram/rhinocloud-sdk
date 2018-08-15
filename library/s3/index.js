const { S3 } = require('aws-sdk');
const apiVersions = require('../../apiVersions.json');
const { gets3UploadParameters } = require('./toolbox/upload.tools');
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
        const s3UploadOptions = gets3UploadParameters(bucket, fullS3FilePath, filePath, options);
        await s3.putObject(s3UploadOptions).promise();
      }
    }
  }

  async function uploadS3File({ bucket, s3FileName, sourceFileName, options }) {
    if (!bucket || !s3FileName || !sourceFileName) {
      throw new Error(`uploadS3File() requires parameters properties: bucket, s3FileName, and sourceFileName`);
    } else {
      const s3UploadOptions = gets3UploadParameters(bucket, s3FileName, sourceFileName, options);
      const resp = await s3.putObject(s3UploadOptions).promise();
      return resp;
    }
  }

  // ------------------------ expose functions ------------------------- //
  this.listBuckets = listBuckets;
  this.getBucket = getBucket;
  this.downloadS3File = downloadS3File;
  this.uploadS3File = uploadS3File;
  this.uploadS3Directory = uploadS3Directory;
}

// ------------------------------- export ----------------------------- //
s3Wrapper.prototype = Object.create(s3Wrapper.prototype);
s3Wrapper.prototype.constructor = s3Wrapper;

module.exports = s3Wrapper;
