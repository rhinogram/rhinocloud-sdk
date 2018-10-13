const chai = require('chai');
const AWSMock = require('aws-sdk-mock');
const sinon = require('sinon');
const sutFactory = require('../../library/s3/index,js');


const { expect } = chai;
const { assert } = chai;
const listObjectsV2 = AWSmock('S3', 'listObjectsV2');
const listBuckets = AWSMock('S3', 'listBuckets');
const listObjectVersions = AWSMock('S3', 'listObjectVersions');

const s3Stub = {
  listBuckets: AWSMock('S3', 'listBuckets', async () => {
    return { Buckets: [{ Name:'bucket1'}, { Name: 'bucket2' }] } ;
  }),
  listObjectsV2TruncFalse: AWSMock('S3', 'listObjectsV2', async () => {
    return { Contents: [{ Key: 'bucket1/file1.jpg' }, { Key: 'bucket1/file2.jpg' }], IsTruncated: false };
  }),
  listObjectsV2TruncTrue: AWSMock('S3', 'listObjectsV2', async () => {
    return {
      Contents: [{ Key: 'bucket1/file1.jpg' }, { Key: 'bucket1/file2.jpg' }],
      IsTruncated: true,
      NextContinuationToken: '1',
    };
  }),
  copyObject: AWSMock('S3', 'copyObject', async () => {
    return true;
  }),
  deleteObject: AWSMock('S3', 'deleteObject', async () => {
    return true;
  }),
  listObjectVersionsTruncFalse: AWSMock('S3', 'listObjectVersions', async () => {
    return {
      Contents: [
      { Key: 'bucket1/file1.jpg', VersionId: '1'},
      { Key: 'bucket1/file1.jpg', VersionId: '2' },
      { Key: 'bucket1/file2.jpg', VersionId: '1' },
      { Key: 'bucket1/file2.jpg', VersionId: '2' },
      ],
      IsTruncated: false,
    }
  }),
  listObjectVersionsTruncTrue: AWSMock('S3', 'listObjectVersions', async() => {
    return {
    Contents: [
      { Key: 'bucket1/file1.jpg', VersionId: '1'},
      { Key: 'bucket1/file1.jpg', VersionId: '2' },
      { Key: 'bucket1/file2.jpg', VersionId: '1' },
      { Key: 'bucket1/file2.jpg', VersionId: '2' },
      ],
      IsTruncated: true,
      NextKeyMarker: '1',
      VersionIdMarker: '1',
    }
  })
}


const sut = sutFactory({
  listBuckets: listBucketsStub,
  getBuckets: getBucketsStub,
  downloadS3File: downloadS3FileStub,
  uploadS3File: uploadS3FileStub,
  uploadS3Directory: uploadS3DirectoryStub,
  moveS3File: moveS3FileStub,
  moveS3Directory: moveS3DirectoryStub,
  copyS3File: copyS3FileStub,
  copyS3Directory: copyS3DirectoryStub,
  deleteS3File: deleteS3FileStub,
  getS3UploadParameters: getS3UploadParametersStub,
  getS3MoveParameters: getS3MoveParametersStub,
  getS3DeleteParameters: getS3DeleteParametersStub,
  getFilePathsFromDirectory: getFilePathsFromDirectoryStub,
  writeFilesFromStream: writeFilesFromStreamStub,
  getFileNameFromS3Key: getFileNameFromS3KeyStub,
  s3: s3Stub,
})

const listObjects = async() => {
  return
};

describe('listBuckets', () => {
  it('should return a list of Buckets', async () => {
    await
  });
});
