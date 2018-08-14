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
}

Rhinocloud.prototype = Object.create(Rhinocloud.prototype);
Rhinocloud.prototype.constructor = Rhinocloud;

module.exports = Rhinocloud;
