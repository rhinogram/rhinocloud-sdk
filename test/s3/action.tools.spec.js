const rewire = require('rewire');
const { expect } = require('chai');
const sut = rewire('../../library/s3/toolbox/action.tools.js');

describe('library/s3/toolbox/action.tools.js', () => {
  describe('getS3UploadParameters()', () => {
    const convertFilePathToBufferStub = (filePath) => {
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('File path is not a string');
      }
      return new Buffer('Some string');
    };
    sut.__set__('convertFilePathToBuffer', convertFilePathToBufferStub);

    describe('When given Bucket, s3Key, and filePath', () => {
      const params = {
        bucket: 'SomeBucket',
        key: 'some-key',
        filePathToUpload: '/some/path',
      };
      it('Should return a Buffer as a "Body" key', () => {
        const res = sut.getS3UploadParameters(params);
        expect(res.Body).to.be.instanceOf(Buffer);
      });
    });
  });
});