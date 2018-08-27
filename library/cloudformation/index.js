const fs = require('fs');
const { CloudFormation } = require('aws-sdk');
const apiVersions = require('../../apiVersions.json');
const paramTools = require('./toolbox/parameter.tools');

function CloudFormationWrapper() {
  const cf = new CloudFormation({ apiVersion: apiVersions.CloudFormation });

  // -------------------------- API functions ---------------------------- //
  async function changeTerminationProtection({ stackName, enableTerminationProtection }) {
    const updateParams = {
      StackName: stackName,
      EnableTerminationProtection: enableTerminationProtection
    };
    const resp = await cf.updateTerminationProtection(updateParams).promise();
    return resp;
  }

  async function cloudForm({ templatePath, stackName, options={} }) {
    if (!templatePath || !stackName) {
      throw new Error(`Must include templatePath (string) and stackName (string) for CloudFormation`);
    } else {
      const fileExists = fs.existsSync(templatePath);
      if (!fileExists) {
        throw new Error(`CloudFormation template: ${templatePath} not found`);
      }
    }

    const stackAlreadyExists = await stackExists(stackName);
    const { waitToComplete, parameters, stdout, enableTerminationProtection } = paramTools.getOptions(options);

    if (stackAlreadyExists) {
      await updateStack(stackName, templatePath, parameters, stdout);
    } else {
      await createStack(templatePath, stackName, parameters, enableTerminationProtection);
    }
    if (waitToComplete) {
      return await waitOnStackToStabilize(stackName, stdout);
    }
  }

  async function createStack(templatePath, stackName, parameters=[], enableTerminationProtection) {
    const params = {
      StackName: stackName,
      TemplateBody: fs.readFileSync(templatePath, 'utf-8'),
      EnableTerminationProtection: enableTerminationProtection,
      Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_IAM'],
      Parameters: paramTools.getCloudFormationParameters(parameters)
    };
    const resp = await cf.createStack(params).promise();
    return resp;
  }

  async function deleteStack({ stackName, options={} }) {
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

  async function stackExists (stackName='') {
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

  async function updateStack(stackName, templatePath, parameters=[], stdout) {
    try {
      const updateParams = {
        StackName: stackName,
        TemplateBody: fs.readFileSync(templatePath, 'utf-8'),
        Parameters: paramTools.getCloudFormationParameters(parameters)
      };
      const resp = await cf.updateStack(updateParams).promise();
      return resp;
    } catch (error) {
      const noUpdatesMsg = `No updates are to be performed.`;
      if (error.message === noUpdatesMsg) {
        if (stdout) console.log(noUpdatesMsg);
        return null;
      }
      throw error;
    }
  }


  async function waitOnStackToStabilize(stackName, stdout, retry=0) {
    const describeParams = { StackName: stackName };
    const WAIT_INTERVAL = 5000;
    if (retry < 240) {
      const { Stacks } = await cf.describeStacks(describeParams).promise();
      const { StackStatus } = Stacks[0];

      if (stdout) console.log(StackStatus);

      if (StackStatus.includes('COMPLETE')) {
        if (stdout) console.log(`done!`);
        return {
          stackName,
          complete: true
        };
      } else if (StackStatus.includes('FAILED')) {
        throw new Error(`${stackName} experience a CloudFormation error.`);
      } else {
        retry +=1;
        await new Promise((res) => setTimeout(res, WAIT_INTERVAL));
        return waitOnStackToStabilize(stackName, stdout, retry);
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
}

// -------------------------------- export ------------------------------- //
CloudFormationWrapper.prototype = Object.create(CloudFormationWrapper.prototype);
CloudFormationWrapper.prototype.constructor = CloudFormationWrapper;

module.exports = CloudFormationWrapper;
