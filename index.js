const CloudFormationWrapper = require('./library/cloudformation');
const S3Wrapper = require('./library/s3');

function Rhinocloud({ accessKeyId = undefined, secretAccessKey = undefined, region = undefined, profile = undefined } = {}) {
  this.cloudformation = new CloudFormationWrapper({ accessKeyId, secretAccessKey, region, profile });
  this.s3 = new S3Wrapper({ accessKeyId, secretAccessKey, region, profile });
}


Rhinocloud.prototype = Object.create(Rhinocloud.prototype);
Rhinocloud.prototype.constructor = Rhinocloud;

module.exports = Rhinocloud;
