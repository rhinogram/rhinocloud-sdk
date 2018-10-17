const fs = require('fs');
const { CloudFormation } = require('aws-sdk');
const apiVersions = require('../../apiVersions.json');
const paramTools = require('./toolbox/parameter.tools');

function CloudFormationWrapper({ accessKeyId, secretAccessKey, region }) {
  const cf = new CloudFormation({
    apiVersion: apiVersions.CloudFormation,
    accessKeyId,
    secretAccessKey,
    region,
  });

  // -------------------------- API functions ---------------------------- //
  async function changeTerminationProtection({ stackName, enableTerminationProtection } = {}) {
    if (!stackName || !enableTerminationProtection) {
      throw new Error('Must include enableTerminationProtection (string) and stackName (string) for CloudFormation');
    }
    const updateParams = {
      StackName: stackName,
      EnableTerminationProtection: enableTerminationProtection,
    };
    const resp = await cf.updateTerminationProtection(updateParams).promise();
    return resp;
  }
  //eslint-disable-next-line consistent-return
  async function cloudForm({ templatePath, stackName, options = {} } = {}) {
    if (!templatePath || !stackName) {
      throw new Error('Must include stackName (string) and templatePath (string) for CloudFormation');
    } else {
      const fileExists = fs.existsSync(templatePath);
      if (!fileExists) {
        throw new Error(`CloudFormation template: ${templatePath} not found`);
      }
    }

    const stackAlreadyExists = await stackExists(stackName);
    const {
      waitToComplete, parameters, stdout, enableTerminationProtection,
    } = paramTools.getOptions(options);

    if (stackAlreadyExists) {
      await updateStack(stackName, templatePath, parameters, stdout);
    } else {
      await createStack(templatePath, stackName, parameters, enableTerminationProtection);
    }
    if (waitToComplete) {
      return waitOnStackToStabilize(stackName, stdout);
    }
  }

  async function createStack(templatePath, stackName, parameters = [], enableTerminationProtection) {
    if (!templatePath || !stackName) {
      throw new Error('Must include templatePath (string) and stackName (string) for CloudFormation');
    }
    const params = {
      StackName: stackName,
      TemplateBody: fs.readFileSync(templatePath, 'utf-8'),
      EnableTerminationProtection: enableTerminationProtection,
      Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_IAM'],
      Parameters: paramTools.getCloudFormationParameters(parameters),
    };
    const resp = await cf.createStack(params).promise();
    return resp;
  }

  async function deleteStack({ stackName, options = {} } = {}) {
    if (!stackName) {
      throw new Error('Must include stackName (string) for CloudFormation');
    }
    const deleteParams = { StackName: stackName };
    const resp = await cf.deleteStack(deleteParams).promise();
    const { waitToComplete, stdout } = paramTools.getOptions(options);
    if (waitToComplete) {
      try {
        await waitOnStackToStabilize(stackName, stdout);
      } catch (error) {
        const noLongerExistsMsg = `Stack with id ${stackName} does not exist`;
        if (error.message === noLongerExistsMsg) {
          if (stdout) console.log(`Successfully deleted ${stackName}`);
          return resp;
        }
        throw error;
      }
    }
    return resp;
  }

  async function getStackOutputs(stackName = '') {
    if (!stackName) {
      throw new Error('Must include stackName (string) for CloudFormation');
    }
    const { Stacks } = await cf.describeStacks({ StackName: stackName }).promise();
    return Stacks.pop();
  }

  async function stackExists(stackName = '') {
    if (!stackName) {
      throw new Error('Must include stackName (string) for CloudFormation');
    }
    try {
      const { Stacks } = await cf.describeStacks({ StackName: stackName }).promise();
      return Stacks.length > 0;
    } catch (error) {
      const notExistsMessage = `Stack with id ${stackName} does not exist`;
      const stackDoesNotExist = error.message.trim() === notExistsMessage;
      if (stackDoesNotExist) {
        return false;
      }
      throw error;
    }
  }

  async function updateStack(stackName, templatePath, parameters = [], stdout) {
    if (!stackName || !templatePath) {
      throw new Error('Must include stackName (string) and templatesPath (string) for CloudFormation');
    }
    try {
      const updateParams = {
        StackName: stackName,
        TemplateBody: fs.readFileSync(templatePath, 'utf-8'),
        Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_IAM'],
        Parameters: paramTools.getCloudFormationParameters(parameters),
      };
      const resp = await cf.updateStack(updateParams).promise();
      return resp;
    } catch (error) {
      const noUpdatesMsg = 'No updates are to be performed.';
      if (error.message === noUpdatesMsg) {
        if (stdout) console.log(noUpdatesMsg);
        return null;
      }
      throw error;
    }
  }


  async function waitOnStackToStabilize(stackName, stdout, retry = 0) {
    if (!stackName) {
      throw new Error('Must include stackName (string) for CloudFormation');
    }
    const describeParams = { StackName: stackName };
    const WAIT_INTERVAL = 5000;
    if (retry < 240) {
      const { Stacks } = await cf.describeStacks(describeParams).promise();
      const { StackStatus } = Stacks[0];

      if (stdout) console.log(StackStatus);

      if (StackStatus.includes('COMPLETE')) {
        if (stdout) console.log('done!');
        return {
          stackName,
          complete: true,
        };
      } if (StackStatus.includes('FAILED')) {
        throw new Error(`${stackName} experience a CloudFormation error.`);
      } else {
        let retryCount = retry;
        retryCount += 1;
        await new Promise((res) => setTimeout(res, WAIT_INTERVAL));
        return waitOnStackToStabilize(stackName, stdout, retryCount);
      }
    } else {
      throw new Error(`Timeout waiting for CloudFormation stack: ${stackName}`);
    }
  }

  // ------------------------- expose functions --------------------------- //
  this.changeTerminationProtection = changeTerminationProtection;
  this.cloudForm = cloudForm;
  this.deleteStack = deleteStack;
  this.stackExists = stackExists;
  this.getStackOutputs = getStackOutputs;
}

// -------------------------------- export ------------------------------- //
CloudFormationWrapper.prototype = Object.create(CloudFormationWrapper.prototype);
CloudFormationWrapper.prototype.constructor = CloudFormationWrapper;

module.exports = CloudFormationWrapper;
