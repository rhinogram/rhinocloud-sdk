const rewire = require('rewire');
const { expect } = require('chai');
const SUT = rewire('../../library/cloudformation');

/* ================= Stubs ======================= */
function CloudFormationStub() {
  return {
    describeStacks: ({ StackName }) => ({
      // mock .promise() of the aws-sdk
      promise: function() {
        let status;
        switch(StackName) {
          case 'create-complete-stack': status = 'CREATE_COMPLETE';
            break;
          case 'rollback-stack': status = 'UPDATE_ROLLBACK_IN_PROGRESS';
            break;
          case 'failed-stack': status = 'UPDATE_FAILED';
            break;
          default: status = 'CREATE_IN_PROGRESS';
            break;
        }
        return new Promise((res) => res({
          Stacks: [{
            Parameters: [{
              ParameterKey: 'Name',
              ParameterValue: 'SomeName',
            }],
            StackStatus: status,
          }],
        }));
      },
    }),
    describeStackEvents: ({ StackName }) => ({
      // mock .promise()
      promise: function() {
        return new Promise((res) => res({
          StackEvents: [{
            StackId: 'xxxxxxxx',
            EventId: 'xxxx',
            StackName,
          }],
        }));
      },
    }),
  };
}

/* =================== Tests ======================= */
describe('library/cloudformation/index.js', () => {
  beforeEach(() => {
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
        expect(firstCfParam.ParameterKey).to.equal('Name');
      });
    });
  });

  describe('waitOnStackToStabilize()', () => {
    describe('When a stack creates successfully', () => {
      it('Should resolve successfully', async() => {
        const sut = new SUT({});
        const resp = await sut.waitOnStackToStabilize('create-complete-stack');
        expect(resp.complete).equal(true);
      });
    });

    describe('When a stack starts to rollback', () => {
      it('Should throw an error', () => {
        const sut = new SUT({});
        return sut.waitOnStackToStabilize('rollback-stack')
        .catch((e) => expect(e.message).equal('rollback-stack experienced a CloudFormation error.'));
      });
    });

    describe('When a stack is given a timeout', () => {
      it('Should throw an error after 5s', () => {
        const sut = new SUT({});
        return sut.waitOnStackToStabilize('timeout-stack', 5000)
        .catch((e) => expect(e.message).equal('Timeout waiting for CloudFormation stack: timeout-stack'));
      });
    });
  });
});
