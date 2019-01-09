const rewire = require('rewire');
const { expect } = require('chai');
const SUT = rewire('../../library/cloudformation');

describe('library/cloudformation/index.js', () => {
  beforeEach(() => {
    function CloudFormationStub() {
      return {
        describeStacks: () => ({
            promise: function() {
              return new Promise((res) => res({
                Stacks: [{
                  Parameters: [{
                    Key: 'Name',
                    Value: 'SomeName',
                  }],
                }],
              }));
            },
          }),
      };
    }

    SUT.__set__('CloudFormation', CloudFormationStub);
  });

  describe('getStackParameters()', () => {
    describe('When invoked', () => {
      it('Should return an array with one Stack object', async() => {
        const sut = new SUT({});
        const getParams = { StackName: 'some-stack' };
        const cfParameters = await sut.getStackParameters(getParams);
        expect(cfParameters.length).to.equal(1);
        const firstCfParam = cfParameters[0];
        expect(firstCfParam.Key).to.equal('Name');
      });
    });
  });
});
