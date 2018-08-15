# rhinocloud-sdk
Rhinocloud-sdk acts as an abstraction layer for the `aws-sdk` that uses JavaScript-friendly syntax, such as camel case functions 
and parameters; Rhinogram uses this tool to make deploying CloudFormation easy and painless. Rhinocloud-sdk is meant to be
a lightweight, micro package to make developing in AWS as easy as possible.

#### Dependencies
* Node v 8.x and higher

#### Usage
```bash
import Rhinocloud from 'rhinocloud-sdk';

const rhinocloud = new Rhinocloud();
```

* Note: AWS Environment keys must be set before instantiating a new instance:
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
  * `options` (object) `optional`:
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
#### Example
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
#### Example
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
#### Example
```bash
async function logBucketContents(name) {
  const resp = await rhinocloud.getBucket(name);
  console.log(resp);
}

logBucketContents('name-of-your-bucket');
```

### downloadS3File
* `downloadS3File(parameters)`: <Promise> Create read/write streams to download a file from S3
#### parameters properties
  * `bucket` (string) `required`: Name of an S3 Bucket in your AWS account.
  * `s3FileName` (string) `required`: File path of the target object, relative to the root of the bucket.
  * `destinationFileName` (string) `required`: File path of what to save the downloaded object as.
#### Example
```bash
async function downloadFile() {
  # this is how you would download s3://your-s3-bucket/dir/examples/example.txt to ./example.txt
  await rhinocloud.downloadS3File({
    bucket: 'your-s3-bucket',
    s3FileName: '/dir/examples/example.txt',
    destinationFileName: 'example.txt'
  });
}

downloadFile();
```


### uploadS3Directory
* `uploadS3Directory(parameters)`: <Promise> Upload a folder/directory to an S3 bucket
#### parameters properties
  * `bucket` (string) `required`: Name of an S3 Bucket in your AWS account.
  * `s3Location` (string) `required`: S3 path where to upload the folder/directory within the bucket.
  * `sourceDirectory` (string) `required`: Local file path of folder/directory to upload.
  * `options` (object) `optional`:
    * `acl` (string)
    * `cacheControl` (string)
    * `contentDisposition` (string)
    * `contentEncoding` (string)
    * `contentLanguage` (string)
    * `contentLength` (number)
    * `contentMd5` (string)
    * `contentType` (string)
    * `expires` (timestamp)
    * `grantFullControl` (string)
    * `grantRead` (string)
    * `grantReadAcp` (string)
    * `grantWriteAcp` (string)
    * `metadata` (object)
    * `sseCustomerAlgorithm` (string)
    * `sseCustomerKey` (buffer || string)
    * `sseCustomemrKeyMd5` (string)
    * `sseKmsKeyId` (string)
    * `serverSideEncryption` (string)
    * `storageClass` (string)
    * `tagging` (string)
    * `websiteRedirectionLocation` (string)
    * `storageClass` (string)
#### Example
```bash
# upload a folder called "localFolder" to s3://your-s3-bucket/localFolder/
async function uploadFolder() {
  const additionalOptions = {
    acl: 'public-read'
  };

  await rhinocloud.uploadS3Directory({
    bucket: 'your-s3-bucket',
    s3Location: '',
    sourceDirectory: 'localFolder',
    options: additionalOptions
  });
}

uploadFolder();
```
```bash
# upload a folder called "localFolder" to s3://your-s3-bucket/storage/localFolder/
async function uploadFolder() {
  const additionalOptions = {
    acl: 'private'
  };

  await rhinocloud.uploadS3Directory({
    bucket: 'your-s3-bucket',
    s3Location: 'storage/',
    sourceDirectory: 'localFolder',
    options: additionalOptions
  });
}

uploadFolder();
```


### uploadS3File
* `uploadS3File(parameters)`: <Promise> Upload a file to an S3 bucket.
#### parameters properties
  * `bucket` (string) `required`: Name of an S3 Bucket in your AWS account.
  * `s3FileName` (string) `required`: Resulting name of the uploaded file.
  * `sourceFileName` (string) `required`: Name of local file to upload.
  * `options` (object) `optional`:
    * `acl` (string)
    * `cacheControl` (string)
    * `contentDisposition` (string)
    * `contentEncoding` (string)
    * `contentLanguage` (string)
    * `contentLength` (number)
    * `contentMd5` (string)
    * `contentType` (string)
    * `expires` (timestamp)
    * `grantFullControl` (string)
    * `grantRead` (string)
    * `grantReadAcp` (string)
    * `grantWriteAcp` (string)
    * `metadata` (object)
    * `sseCustomerAlgorithm` (string)
    * `sseCustomerKey` (buffer || string)
    * `sseCustomemrKeyMd5` (string)
    * `sseKmsKeyId` (string)
    * `serverSideEncryption` (string)
    * `storageClass` (string)
    * `tagging` (string)
    * `websiteRedirectionLocation` (string)
    * `storageClass` (string)
#### Example
```bash
# upload a file called test.txt to s3://your-s3-bucket/files/test.txt
async function upload() {
  await rhinocloud.uploadS3File({
    bucket: 'your-s3-bucket',
    s3FileName: 'files/test.txt',
    sourceFileName: 'test.txt'
  });
}

upload();
```