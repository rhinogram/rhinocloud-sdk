const fs = require('fs');
const { S3 } = require('aws-sdk');
const sdkVersions = require('../../sdkVersions.json');

function s3Wrapper() {
  const s3 = new S3({ apiVersion: sdkVersions.S3 });

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
    return new Promise((res) => {
      const getParams = {
        Bucket: bucket,
        Key: s3FileName
      };
      const readStream = s3.getObject(getParams).createReadStream();
      const writeStream = fs.createWriteStream(destinationFileName);
      readStream.pipe(writeStream);

      writeStream.on('finish', res);
    });
  }

  this.listBuckets = listBuckets;
  this.getBucket = getBucket;
  this.downloadS3File = downloadS3File;
}

s3Wrapper.prototype = Object.create(s3Wrapper.prototype);
s3Wrapper.prototype.constructor = s3Wrapper;

module.exports = s3Wrapper;
