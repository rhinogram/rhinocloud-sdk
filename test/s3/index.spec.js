const rewire = require('rewire');
const AWS = require('aws-sdk-mock');
const { spy } = require('sinon');
const { assert } = require('chai');
const SUT = rewire('../../library/s3');

describe('library/s3/index.js', () => {
  describe('uploadS3Directory()', () => {
    // ---------------- stubs ------------------------- //
    const getFilePathsFromDirectoryStub = (sourceDir) => {
      const arr = [`${sourceDir}/some/file.txt`, `${sourceDir}/another/file.json`];
      return arr;
    };
    // eslint-disable-next-line
    const getS3UploadParametersStub = ({ bucket, key, filePathToUpload, options={} }) => {
      return {
        Bucket: bucket,
        Key: key,
        Body: new Buffer('any string'),
      };
    };
    const debugLogStub = spy();

    // Rewire before each test block so that sinon.fake is reset
    beforeEach(() => {
      SUT.__set__('getFilePathsFromDirectory', getFilePathsFromDirectoryStub);
      SUT.__set__('getS3UploadParameters', getS3UploadParametersStub);
      SUT.__set__('debugLog', debugLogStub);
      AWS.mock('S3', 'putObject', (params, callback) => {
        params.should.be.an.Object();
        params.should.have.property('Bucket', 'some-bucket');
        params.should.have.property('Key');
        params.should.have.property('Body');

        callback(null, {
          ETag: 'some-etag',
          Key: params.Key,
          Bucket: 'some-bucket'
        });
      });
    });


    describe('When provided "tmp" as the source directory', () => {
      // Suspend this test because of async issues with aws-sdk-mock S3
      xit('Should call debugLog()', (done) => {
        const sut = new SUT({
          accessKeyId: undefined,
          secretAccessKey: undefined,
          region: 'us-east-1',
        });
        const params = {
          bucket: 'some-bucket',
          s3Location: 'some-key',
          sourceDirectory: 'tmp',
        };
        return sut.uploadS3Directory(params)
        .then(() => {
          // console.log(resp);
          assert(debugLogStub.called);
          return Promise.resolve();
        })
        .then(done)
        .catch(done);
      });
    });
  });
});