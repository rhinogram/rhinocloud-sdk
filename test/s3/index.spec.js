const rewire = require('rewire');
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
    function S3Stub() {
      return {
        putObject: () => ({
            promise: () => new Promise((res) => res())
        }),
      };
    }

    // Rewire before each test block so that sinon.fake is reset
    beforeEach(() => {
      SUT.__set__('getFilePathsFromDirectory', getFilePathsFromDirectoryStub);
      SUT.__set__('getS3UploadParameters', getS3UploadParametersStub);
      SUT.__set__('debugLog', debugLogStub);
      SUT.__set__('S3', S3Stub);
    });


    describe('When provided "tmp" as the source directory', () => {
      // Suspend this test because of async issues with aws-sdk-mock S3
      it('Should call debugLog()', async() => {
        const sut = new SUT({
          region: 'us-east-1',
        });
        const params = {
          bucket: 'some-bucket',
          s3Location: 'some-key',
          sourceDirectory: 'tmp',
        };
        await sut.uploadS3Directory(params);
        assert(debugLogStub.called);
      });
    });
  });
});
