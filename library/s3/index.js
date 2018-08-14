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

  this.listBuckets = listBuckets;
  this.getBucket = getBucket;
}

s3Wrapper.prototype = Object.create(s3Wrapper.prototype);
s3Wrapper.prototype.constructor = s3Wrapper;

module.exports = s3Wrapper;
