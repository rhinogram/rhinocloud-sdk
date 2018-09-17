const CloudFormationWrapper = require('./library/cloudformation');
const S3Wrapper = require('./library/s3');

function Rhinocloud({ accessKeyId, secretAccessKey, region }) {
  this.cloudformation = new CloudFormationWrapper({ accessKeyId, secretAccessKey, region });
  this.s3 = new S3Wrapper({ accessKeyId, secretAccessKey, region });
}


Rhinocloud.prototype = Object.create(Rhinocloud.prototype);
Rhinocloud.prototype.constructor = Rhinocloud;

module.exports = Rhinocloud;
