# rhinocloud-sdk
Rhinocloud acts as an abstraction layer for the `aws-sdk` that uses JavaScript-friendly syntax, such as camel case functions and parameters; and
also handles certain errors that can cause frustrations or unnecessary code to work around the CloudFormation API.

#### Dependencies
* Node v 8.x and higher

#### Usage
* `ES6`
```bash
import Rhinocloud from 'rhinocloud-sdk';

const rhinocloud = new Rhinocloud();
```

* `ES5`
```bash
const Rhinocloud = require('rhinocloud-sdk');

const rhinocloud = new Rhinocloud();
```

* Note: AWS Environment keys must be set before importing/requiring module:
  * `AWS_ACCESS_KEY_ID`
  * `AWS_SECRET_ACCESS_KEY`
  * `AWS_REGION`

* Example using `dotenv` library with `rhinocloud-sdk`: https://www.npmjs.com/package/dotenv
```bash
import dotenv from 'dotenv';
import Rhinocloud from 'rhinocloud-sdk';

dotenv.config({ path: `${__dirname}/.env` });

const rhinocloud = new Rhinocloud();
```

## CloudFormation Functions
### changeTerminationProtection
* `changeTerminationProtection(parameters)`: <Promise> Update CloudFormation termination protection.
#### parameters properties
  * `stackName` (string) `required`: Name of CloudFormation stack.
  * `enableTerminationProtection` (boolean) `required`: Enable CloudFormation termination protection.
#### Example
```bash
# Enable termination protection:
async function turnOnTerminationProtection() {
  await rhinocloud.changeTerminationProtection({
  stackName: 'your-stack-name-to-update',
  enableTerminationProtection: true
  });
}

turnOnTerminationProtection();
```

### cloudForm
* `cloudForm(parameters)`: <Promise> Update existing CloudFormation stack or create new stack if it does not already exist.
#### parameters properties
  * `templatePath` (string) `required`: Absolute file path of a CloudFormation template (can be JSON or YAML).
  * `stackName` (string) `required`: Name of a CloudFormation stack (must be unique across AWS account).
  * `options` (oject) `optional`:
    * `waitToComplete` (boolean):  Wait on a success or failure response (defaults to `true`).
    * `stdout` (boolean): Print standard output to the console (defaults to `true`).
    * `parameters` (array): CloudFormation parameters that correlate to the CloudFormation template. Each object in the array must contain:
      * `key` (string): Name of the parameter.
      * `value` (any): Value of the parameter.
    * `enableTerminationProtection` (boolean) `optional`: Enable termination protection of CloudFormation stack. Only applies to new stacks (defaults to `false`).
#### Example
```bash
# template.yml
AWSTemplateFormatVersion: '2010-09-09'
Parameters:
  Name:
    Type: String
Resources:
  Bucket:
    Type: AWS::S3::Bucket
    Properties: 
      AccessControl: 'Public'
      BucketName: !Ref 'Name'
      Tags:
        - Key: Name
          Value: !Ref 'Name'
Outputs:
  Bucket:
    Value: !Ref Bucket
```

```bash
# deploy.js
const opts = {
  parameters: [{
    key: 'Name',
    value: 'my-bucket-unique-across-aws-region'
  }]
};

async function createOrUpdate() {
  await rhinocloud.cloudForm({
    stackName: 'a-stack-name',
    templatePath: `${__dirname}/template.yml`,
    options: opts
  });
}

createOrUpdate();
```

### deleteStack
* `deleteStack(parameters)`: <Promise> Delete CloudFormation stack.
#### parameters properties
  * `stackName` (string) `required`: Name of CloudFormation stack to delete.
  * `options` (object) `optional`:
    * `waitToComplete` (boolean):  Wait on a success or failure response (defaults to `true`).
    * `stdout` (boolean): Print standard output to the console (defaults to `true`).
#### Example
```bash
async function delete() {
  await rhinocloud.deleteStack({
    stackName: 'stack-to-remove'
  });
}

delete();
```

### stackExists
* `stackExists(stackName)`: <Promise> Returns `true` or `false` if a CloudFormation stack exists.
#### arguments
  * `stackName` (string) `required`: Name of CloudFormation stack.
```bash
async function logIfStackExists() {
  const exists = await rhinocloud.stackExists('a-stack-name-to-check');
  console.log(exists);
}

logIfStackExists();
```

## S3 Functions
### listBuckets
* `listBuckets()`: <Promise> Returns an array of objects that each contain `Name` (string) and `CreationDate` (timestamp)
```bash
async function logAllBucketsInAccount() {
  const resp = await rhinocloud.listBuckets();
  console.log(resp);
}

logAllBucketsInAccount();
```

### getBucket
* `getBucket(bucketName)`: <Promise> Returns an array of objects that each contain:
  * `Key` (string)
  * `LastModified` (timestamp)
  * `ETag` (string)
  * `Size` (number)
  * `StorageClass` (string)
  * `Owner` (object)
    * `DisplayName` (string)
    * `ID` (string)
#### arguments
  * `bucketName` (string): Name of the S3 Bucket to get bucket contents.
```bash
async function logBucketContents(name) {
  const resp = await rhinocloud.getBucket(name);
  console.log(resp);
}

logBucketContents('name-of-your-bucket');
```
