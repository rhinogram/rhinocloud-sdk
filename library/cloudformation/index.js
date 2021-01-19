const fs = require('fs');
const { CloudFormation } = require('aws-sdk');
const apiVersions = require('../../apiVersions.json');
const { getCredentialsObject } = require('../_helpers');
const {
  getCloudFormationParameters,
  getOptions,
} = require('./toolbox/parameter.tools');
const { debugLog } = require('../helpers');

function CloudFormationWrapper(credentialsOpts) {
  const credentials = getCredentialsObject(credentialsOpts, apiVersions.CloudFormation);
  const cf = new CloudFormation(credentials);

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
  async function cloudForm({ templatePath, templateUrl, stackName, options={} } = {}) {
    if (!stackName) {
      throw new Error('Must include stackName (string) for CloudFormation');
    } else if (templatePath) {
      const fileExists = fs.existsSync(templatePath);
      if (!fileExists) {
        throw new Error(`CloudFormation template: ${templatePath} not found`);
      }
    }

    const stackAlreadyExists = await stackExists(stackName);
    const {
      waitToComplete,
      parameters,
      enableTerminationProtection,
      protectedResourceTypes,
      notificationArns,
      onFailure,
    } = getOptions(options);

    if (stackAlreadyExists) {
      await updateStack(stackName, templatePath, parameters, notificationArns, protectedResourceTypes, templateUrl);
    } else {
      await createStack(templatePath, stackName, parameters, notificationArns, enableTerminationProtection, templateUrl, onFailure);
    }
    if (waitToComplete) {
      return waitOnStackToStabilize(stackName);
    }
  }

  async function createChangeSet(templatePath, stackName, parameters, notificationArns, templateUrl) {
    const changeSetName = `${stackName}-${new Date().getTime()}`;
    const cloudformationParams = getCloudFormationParameters(parameters);

    const { Id: changeSetArn } = await cf.createChangeSet({
      ChangeSetName: changeSetName,
      Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_IAM'],
      Parameters: cloudformationParams,
      StackName: stackName,
      ...templatePath && { TemplateBody: fs.readFileSync(templatePath, 'utf-8') },
      ...templateUrl && { TemplateURL: templateUrl },
      UsePreviousTemplate: (!templateUrl && !templatePath),
      NotificationARNs: notificationArns,
    }).promise();

    try {
      debugLog(`Waiting for ChangeSet: ${changeSetArn} to finish creating...`);
      await cf.waitFor('changeSetCreateComplete', { ChangeSetName: changeSetArn }).promise();
    } catch (error) {
      if (error.message === 'Resource is not in the state changeSetCreateComplete') {
        debugLog(`ChangeSet: ${changeSetArn} does not contain any changes.`);
      } else {
        throw error;
      }
    }

    const describeChangeSetParams = {
      ChangeSetName: changeSetArn,
      StackName: stackName,
    };
    return cf.describeChangeSet(describeChangeSetParams).promise();
  }

  async function createStack(templatePath, stackName, parameters = [], notificationArns = [], enableTerminationProtection, templateUrl, onFailure) {
    if ((!templatePath && !templateUrl) || !stackName) {
      throw new Error('Must include templatePath (string) or templateUrl (string) and stackName (string) for CloudFormation');
    }

    const params = {
      StackName: stackName,
      ...templatePath && { TemplateBody: fs.readFileSync(templatePath, 'utf-8') },
      ...templateUrl && { TemplateURL: templateUrl },
      EnableTerminationProtection: enableTerminationProtection,
      Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_IAM'],
      Parameters: getCloudFormationParameters(parameters),
      NotificationARNs: notificationArns,
      OnFailure: onFailure,
    };
    debugLog(params);
    const resp = await cf.createStack(params).promise();
    return resp;
  }

  async function deleteStack({ stackName, options = {} } = {}) {
    if (!stackName) {
      throw new Error('Must include stackName (string) for CloudFormation');
    }
    const deleteParams = { StackName: stackName };
    const resp = await cf.deleteStack(deleteParams).promise();
    const { waitToComplete } = getOptions(options);
    if (waitToComplete) {
      try {
        await waitOnStackToStabilize(stackName);
      } catch (error) {
        const noLongerExistsMsg = `Stack with id ${stackName} does not exist`;
        if (error.message === noLongerExistsMsg) {
          debugLog(`Successfully deleted ${stackName}`);
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
    const { Outputs } = Stacks.pop();
    return Outputs;
  }

  async function getStackParameters(stackName = '') {
    if (!stackName) {
      throw new Error('Must include stackName (string) for CloudFormation');
    }
    const { Stacks } = await cf.describeStacks({ StackName: stackName }).promise();
    const { Parameters } = Stacks.pop();
    return Parameters;
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

  async function updateStack(stackName, templatePath, parameters = [], notificationArns = [], protectedResourceTypes = [], templateUrl) {
    if (!stackName) {
      throw new Error('Must include stackName (string) and templatesPath (string) for CloudFormation');
    }

    const { ExecutionStatus, StatusReason, Changes = [], ChangeSetId } = await createChangeSet(templatePath, stackName, parameters, notificationArns, templateUrl);

    if (ExecutionStatus === 'AVAILABLE') {
      const resourcesToBeChanged = Changes.map((c) => c.ResourceChange);
      const problematicUpdates = resourcesToBeChanged.filter(({ Replacement, ResourceType }) => {
        const isProtectedResource = protectedResourceTypes.includes(ResourceType);
        return isProtectedResource && Replacement === 'True';
      });
      if (problematicUpdates.length > 0) {
        const problemChangesStr = JSON.stringify(problematicUpdates);
        throw new Error(`ChangeSet: ${ChangeSetId} would cause the following protected resources to be replaced: ${problemChangesStr}. Not applying changes.`);
      } else {
        // apply changes
        await cf.executeChangeSet({
          StackName: stackName,
          ChangeSetName: ChangeSetId,
        }).promise();
      }
    } else if (StatusReason === 'The submitted information didn\'t contain changes. Submit different information to create a change set.') {
      debugLog(`No changes detected to CloudFormation stack: ${stackName}`);

      // delete ChangeSet
      await cf.deleteChangeSet({
        ChangeSetName: ChangeSetId,
        StackName: stackName,
      }).promise();
    } else {
      throw new Error(`ChangeSet: ${ChangeSetId} execution status is: ${ExecutionStatus} and cannot be applied.`);
    }
  }

  async function waitOnStackToStabilize(stackName, msLeftBeforeTimeout) {
    if (!stackName) {
      throw new Error('Must include stackName (string) for CloudFormation');
    }
    const describeParams = { StackName: stackName };
    const WAIT_INTERVAL = 5000;
    // use explicit undefined check because negative numbers are truthy
    if (msLeftBeforeTimeout === undefined || msLeftBeforeTimeout > 0) {
      const { Stacks } = await cf.describeStacks(describeParams).promise();
      const { StackStatus } = Stacks[0];

      debugLog(StackStatus);

      if (StackStatus.includes('ROLLBACK') || StackStatus.includes('FAILED')) {
        // DEBUG log stack events to assist with troubleshooting
        const { StackEvents: events } = await cf.describeStackEvents({ StackName: stackName }).promise();
        debugLog(events);
        throw new Error(`${stackName} experienced a CloudFormation error.`);
      } else if (StackStatus.includes('COMPLETE')) {
        debugLog('done!');
        return {
          stackName,
          complete: true,
        };
      } else {
        await new Promise((res) => setTimeout(res, WAIT_INTERVAL));
        const newTimeLeft = msLeftBeforeTimeout === undefined ? undefined : msLeftBeforeTimeout - WAIT_INTERVAL;
        return waitOnStackToStabilize(stackName, newTimeLeft);
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
  this.getStackParameters = getStackParameters;
  this.waitOnStackToStabilize = waitOnStackToStabilize;
}

// -------------------------------- export ------------------------------- //
CloudFormationWrapper.prototype = Object.create(CloudFormationWrapper.prototype);
CloudFormationWrapper.prototype.constructor = CloudFormationWrapper;

module.exports = CloudFormationWrapper;
