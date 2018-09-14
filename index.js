const CloudFormationWrapper = require('./library/cloudformation');
const S3Wrapper = require('./library/s3');
const dotenv =  require('dotenv').config()

function Rhinocloud() {
  this.cloudformation = new CloudFormationWrapper();
  this.s3 = new S3Wrapper();
}

Rhinocloud.prototype.setKeys = function(awsAccesKeyId, awsSecretKey, awsRegion) {
  this.awsAccesKeyId = awsAccesKeyId;
  this.awsSecretKey = awsSecretKey;
  this.awsRegion = awsRegion;
}

Rhinocloud.prototype.getKeys = function() {
  return {
    awsAccesKeyId: this.awsAccesKeyId,
    awsSecretKey: this.awsSecretKey,
    awsRegion: this.awsRegion,
  };
}


Rhinocloud.prototype = Object.create(Rhinocloud.prototype);
Rhinocloud.prototype.constructor = Rhinocloud;

module.exports = Rhinocloud;
