const chai = require('chai');
const AWSMock = require('aws-sdk-mock');
const sinon = require('sinon');
const s3 = require('../../library/s3/index,js');


const { expect } = chai;
const { assert } = chai;
const listObjectsV2 = AWSmock('S3', 'listObjectsV2', )
const listBuckets = AWSMock('S3', 'listBuckets', )

describe('listBuckets', () => {
  it('should list the buckets', () => {

  });
});