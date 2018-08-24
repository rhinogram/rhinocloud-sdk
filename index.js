const CloudFormationWrapper = require('./library/cloudformation');
const S3Wrapper = require('./library/s3');

function Rhinocloud() {
  // CloudFormation
  const cf = new CloudFormationWrapper();
  this.cloudForm = cf.cloudForm;
  this.stackExists = cf.stackExists;
  this.deleteStack = cf.deleteStack;
  this.changeTerminationProtection = cf.changeTerminationProtection;

  // S3
  const s3 = new S3Wrapper();
  this.listBuckets = s3.listBuckets;
  this.getBucket = s3.getBucket;
  this.downloadS3File = s3.downloadS3File;
  this.uploadS3File = s3.uploadS3File;
  this.uploadS3Directory = s3.uploadS3Directory;
  this.moveS3File = s3.moveS3File;
  this.moveS3Directory = s3.moveS3Directory;
}

Rhinocloud.prototype = Object.create(Rhinocloud.prototype);
Rhinocloud.prototype.constructor = Rhinocloud;

module.exports = Rhinocloud;
