const { expect } = require('chai');
const SUT = require('../../library/_helpers');

describe('_helpers', () => {
  describe('getCredentialsObject()', () => {
    describe('When given a profile, accessKeyId, and secretAccessKey', () => {
      it('it should return an object with a profile only', () => {
        const credentialsOpts = {
          accessKeyId: 'xxxxxxx',
          secretAccessKey: 'xxxxxxxxxxxx',
          region: 'us-east-1',
          profile: 'my-profile',
        };
        const credentials = SUT.getCredentialsObject(credentialsOpts);
  
        expect(credentials.profile).equal('my-profile');
        expect(credentials.accessKeyId).equal(undefined);
        expect(credentials.secretAccessKey).equal(undefined);
        expect(credentials.region).equal('us-east-1');
        expect(credentials.apiVersion).equal(undefined);
      });
    });

    describe('When given accessKeyId, secretAccessKey, region, and apiVersion', () => {
      it('Should return the exact parameters passed in', () => {
        const credentialsOpts = {
          accessKeyId: 'xxxxxxx',
          secretAccessKey: 'xxxxxxxxxxxx',
          region: 'us-east-1',
        };
        const credentials = SUT.getCredentialsObject(credentialsOpts, '2012-09-09');

        expect(credentials.accessKeyId).equal('xxxxxxx');
        expect(credentials.secretAccessKey).equal('xxxxxxxxxxxx');
        expect(credentials.region).equal('us-east-1');
        expect(credentials.apiVersion).equal('2012-09-09');
        expect(credentials.profile).equal(undefined);
      });
    });
  });
});
