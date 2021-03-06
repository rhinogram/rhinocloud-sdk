# rhinocloud-sdk
Rhinocloud-sdk acts as an abstraction layer for the `aws-sdk` that uses JavaScript-friendly syntax, such as camel case functions
and parameters; Rhinogram uses this tool to make deploying CloudFormation easy and painless. Rhinocloud-sdk is meant to be
a lightweight, micro package to make developing in AWS as easy as possible.

#### Dependencies
* Node v 8.x and higher

#### Usage
```bash
import Rhinocloud from 'rhinocloud-sdk';

const rhinocloud = new Rhinocloud({
  accessKeyId: < Your AWS Access Key Id >,
  secretAccessKey: < Your AWS Secret Key >,
  region: < AWS Region >,
});
```

* OR You can use process.env keys before instantiating a new instance:
  * `AWS_ACCESS_KEY_ID`
  * `AWS_SECRET_ACCESS_KEY`
  * `AWS_REGION`


* Setting `process.env.DEBUG = true` or `process.env.LOG_LEVEL = 'debug'` will enable debug mode.

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
  await rhinocloud.cloudformation.changeTerminationProtection({
  stackName: 'your-stack-name-to-update',
  enableTerminationProtection: true
  });
}

turnOnTerminationProtection();
```

### cloudForm
* `cloudForm(parameters)`: <Promise> Update existing CloudFormation stack or create new stack if it does not already exist.
#### parameters properties
  * `templatePath` (string) `conditional`: Absolute file path of a CloudFormation template (can be JSON or YAML). For first deployment, either `templatePath` or `templateUrl` is required.
  * `templateUrl` (string) `conditional`: Https URL of a template in S3. For first deployment, either `templatePath` or `templateUrl` is required.
  * `stackName` (string) `required`: Name of a CloudFormation stack (must be unique across AWS account).
  * `options` (object) `optional`:
    * `waitToComplete` (boolean):  Wait on a success or failure response (defaults to `true`).
    * `timeout` (number) `optional`: How long in milliseconds to wait, if `waitToComplete` is set to `true`, for the stack to complete before timing out. The CloudFormation stack will continue what it is doing even though the function errors to stop making CloudFormation API calls.
    * `parameters` (array): CloudFormation parameters that correlate to the CloudFormation template. If the request is an update to an existing stack, existing parameter values are applied to omitted parameters. Each object in the array must contain:
      * `key` (string): Name of the parameter.
      * `value` (any): Value of the parameter.
    * `protectedResourceTypes` (array) `optional`: AWS Resource types that will cause the function to error out when the ChangeSet calls for `Replacement` (see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html).
    * `enableTerminationProtection` (boolean) `optional`: Enable termination protection of CloudFormation stack. Only applies to new stacks (defaults to `false`).
    * `notificationArns` (array) `optional`: Array of ARN strings that identify SNS Topics that will be triggered on CloudFormation state change.
    * `onFailure` (string) `optional`: See "OnFailure" option in https://docs.aws.amazon.com/AWSCloudFormation/latest/APIReference/API_CreateStack.html.
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
  await rhinocloud.cloudformation.cloudForm({
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
#### Example
```bash
async function delete() {
  await rhinocloud.cloudformation.deleteStack({
    stackName: 'stack-to-remove'
  });
}

delete();
```

### getStackOutputs
* `getStackOutputs(stackName)`: <Promise> Get an array of output objects from the `Outputs` section of a CloudFormation template.
#### arguments
  * `stackName` (string) `require`: Name of a CloudFormation stack.
#### Example
```bash
# cloudformation.yml
# created with a stack name of s3-my-bucket
...
Resources:
  Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: 'my-bucket'
...
Outputs:
  Bucket:
    Value: !Ref Bucket
```

```bash
async function logStackOutputs() {
  const outputs = await rhinocloud.cloudformation.getStackOutputs('s3-my-bucket');
  console.log(outputs);
#  [
#   { OutputKey: 'Bucket', OutputValue: 'my-bucket' }  
#  ]
}

logStackOutputs();
```

### getStackParameters
* `getStackParameters(stackName)`: <Promise> Get an Array of parameter objects used to create or update a CloudFormation stack.
#### arguments
* `stackName` (string) `required`: Name of a CloudFormation stack.
#### Example
```bash
# cloudformation.yml
# created with a stack name of s3-my-bucket
...
Parameters:
  BucketName:
    Type: String
    Default: 'my-bucket-name'

Resources:
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref 'BucketName'
...
```

```bash
# getParams.js
async function getParameters() {
  const params = await rhinocloud.cloudformation.getStackParameters('s3-my-bucket');
  console.log(params);
  # [
  #  { ParameterKey: 'BucketName', ParameterValue: 'my-bucket-name' }
  # ]
}

getParameters();
```

### stackExists
* `stackExists(stackName)`: <Promise> Returns `true` or `false` if a CloudFormation stack exists.
#### arguments
  * `stackName` (string) `required`: Name of CloudFormation stack.
#### Example
```bash
async function logIfStackExists() {
  const exists = await rhinocloud.cloudformation.stackExists('a-stack-name-to-check');
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
  const resp = await rhinocloud.s3.listBuckets();
  console.log(resp);
}

logAllBucketsInAccount();
```

### getBucket
* `getBucket(parameters)`: <Promise> Returns an array of objects that each contain:
  * `Key` (string)
  * `LastModified` (timestamp)
  * `ETag` (string)
  * `Size` (number)
  * `StorageClass` (string)
  * `Owner` (object)
    * `DisplayName` (string)
    * `ID` (string)
#### parameters properties
  * `bucket` (string) `required`: Name of the S3 Bucket to get bucket contents.
  * `prefix` (string) `optional` : Name of the folder/file to get - this is a path to a file or folder with '/' Delimiter.
#### Example
```bash
async function logBucketContents(name) {
  const resp = await rhinocloud.s3.getBucket(name);
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
  await rhinocloud.s3.downloadS3File({
    bucket: 'your-s3-bucket',
    s3FileName: '/dir/examples/example.txt',
    destinationFileName: 'example.txt'
  });
}

downloadFile();
```

### moveS3File
* `moveS3File(parameters)`: <Promise> Copy s3 file to another location and delete file from old location
#### parameters properties
  * `sourceBucket` (string) `required`: Name of the S3 bucket where the file originated.
  * `s3SourceFile` (string) `required`: S3 Key to move.
  * `destinationBucket` (string) `required`: Name of S3 Bucket where the file should be moved to.
  * `s3DestinationFile` (string) `required`: Resulting S3 key name of the new file location.
  * `options` (object) `optional`:
    * `acl` (string)
    * `cacheControl` (string)
    * `contentDisposition` (string)
    * `contentEncoding` (string)
    * `contentLanguage` (string)
    * `contentLength` (number)
    * `contentMd5` (string)
    * `contentType` (string)
    * `copySourceIfMatch` (string)
    * `copySourceIfModifiedSince` (string)
    * `copySourceIfNoneMatch` (string)
    * `copySourceIfUnmodifiedSince` (string)
    * `copySourceSSECustomerAlgorithm` (string)
    * `copySourceSSECustomerKeyMd5` (string)
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
async function moveMyFile() {
  # this moves s3://bucketA/files/someFile.txt to s3://bucketB/newlocation/newName.txt
  await rhinocloud.s3.moveS3File({
    sourceBucket: 'bucketA',
    s3SourceFile: 'files/someFile.txt',
    destinationBucket: 'bucketB',
    s3DestinationFile: 'newlocation/newName.txt'
  });

  await moveMyFile();
}
```

### moveS3Directory
* `moveS3Directory(parameters)`: <Promise> Recursively move directory/file from one S3 location to another.
#### parameters properties
  * `sourceBucket` (string) `required`: Name of the S3 bucket where the directory originated.
  * `s3SourceDirectory` (string) `required`: Directory in S3 to move.
  * `destinationBucket` (string) `required`: Name of the s3 bucket in which to move the directory.
  * `s3DestinationDirectory` (string) `required`: Name of the directory after it is moved (can also be an empty string or `/` to move the directory as is).
  * `options` (object) `optional`:
    * `acl` (string)
    * `cacheControl` (string)
    * `contentDisposition` (string)
    * `contentEncoding` (string)
    * `contentLanguage` (string)
    * `contentLength` (number)
    * `contentMd5` (string)
    * `contentType` (string)
    * `copySourceIfMatch` (string)
    * `copySourceIfModifiedSince` (string)
    * `copySourceIfNoneMatch` (string)
    * `copySourceIfUnmodifiedSince` (string)
    * `copySourceSSECustomerAlgorithm` (string)
    * `copySourceSSECustomerKeyMd5` (string)
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
    * `exclude` (array of strings)
    * `throttleInterval` (number): Ms of delay in between S3 requests for each file
#### Example
```bash
# this moves all files in s3://my-bucket/files, except
# s3://my-bucket/files/noMoveThis.txt to s3://my-bucket/movedFiles/
async function moveSomeFiles() {
  const options = {
    exclude: ['files/noMoveThis.txt']
  };

  await rhinocloud.s3.moveS3Directory({
    sourceBucket: 'my-bucket',
    s3SourceDirectory: 'files',
    destinationbucket: 'my-bucket',
    s3DestinationDirectory: 'movedFiles/',
    options
  });
}

await moveSomeFiles();
```

### copyS3Directory
* `moveS3Directory(parameters)`: <Promise> Recursively copy directory/file from one S3 location to another.
#### parameters properties
  * `sourceBucket` (string) `required`: Name of the S3 bucket where the directory originated.
  * `s3SourceDirectory` (string) `required`: Directory in S3 to copy.
  * `destinationBucket` (string) `required`: Name of the s3 bucket in which to copy the directory.
  * `s3DestinationDirectory` (string) `required`: Name of the directory after it is copied (can also be an empty string or `/` to copy the directory as is).
  * `options` (object) `optional`:
    * `acl` (string)
    * `cacheControl` (string)
    * `contentDisposition` (string)
    * `contentEncoding` (string)
    * `contentLanguage` (string)
    * `contentLength` (number)
    * `contentMd5` (string)
    * `contentType` (string)
    * `copySourceIfMatch` (string)
    * `copySourceIfModifiedSince` (string)
    * `copySourceIfNoneMatch` (string)
    * `copySourceIfUnmodifiedSince` (string)
    * `copySourceSSECustomerAlgorithm` (string)
    * `copySourceSSECustomerKeyMd5` (string)
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
    * `exclude` (array of strings)
    * `throttleInterval` (number): Ms of delay in between S3 requests for each file
#### Example
```bash
# this copies all files in s3://my-bucket/files, except
# s3://my-bucket/files/coCopyThis.txt to s3://my-bucket/movedFiles/
async function copySomeFiles() {
  const options = {
    exclude: ['files/noCopyThis.txt']
  };

  await rhinocloud.s3.copyS3Directory({
    sourceBucket: 'my-bucket',
    s3SourceDirectory: 'files',
    destinationbucket: 'my-bucket',
    s3DestinationDirectory: 'copiedFiles/',
    options
  });
}

await copySomeFiles();
```


### copyS3File
* `copyS3File(parameters)`: <Promise> Copy s3 File to another location.
#### parameters properties
  * `sourceBucket` (string) `required`: Name of the S3 bucket where the directory originated.
  * `s3SourceFile` (string) `required`: S3 key to copy.
  * `destinationBucket` (string) `required`: Name of the s3 bucket in which the file should be copied to.
  * `s3DestinationFile` (string) `required`: Resulting S3 key name of the new file   * `options` (object) `optional`:
    * `acl` (string)
    * `cacheControl` (string)
    * `contentDisposition` (string)
    * `contentEncoding` (string)
    * `contentLanguage` (string)
    * `contentLength` (number)
    * `contentMd5` (string)
    * `contentType` (string)
    * `copySourceIfMatch` (string)
    * `copySourceIfModifiedSince` (string)
    * `copySourceIfNoneMatch` (string)
    * `copySourceIfUnmodifiedSince` (string)
    * `copySourceSSECustomerAlgorithm` (string)
    * `copySourceSSECustomerKeyMd5` (string)
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
    * `exclude` (array of strings)
    * `throttleInterval` (number): Ms of delay in between S3 requests for each file
#### Example
```bash
  # this copies s3://bucketA/files/someFile.txt to s3://bucketB/newlocation/newName.txt
async function copyMyFile() {
  await rhinocloud.s3.moveS3File({
    sourceBucket: 'bucketA',
    s3SourceFile: 'files/someFile.txt',
    destinationBucket: 'bucketB',
    s3DestinationFile: 'newlocation/newName.txt'
  });
}

await copyMyFile();
```

### deleteS3Directory
* `moveS3Directory(parameters)`: <Promise> Recursively delete directory/file from a S3 location.
#### parameters properties
  * `sourceBucket` (string) `required`: Name of the S3 bucket where the directory originated.
  * `s3SourceDirectory` (string) `required`: Directory in S3 to delete.
  * `options` (object) `optional`:
    * `MFA` (string)
    * `RequestPayer` (string)
    * `exclude` (array of strings)
#### Example
```bash
# this deletes all files in s3://my-bucket/files, except
# s3://my-bucket/files/noDeleteThis.txt to s3://my-bucket/movedFiles/
async function deleteSomeFiles() {
  const options = {
    exclude: ['files/noDeleteThis.txt']
  };

  await rhinocloud.s3.deleteS3Directory({
    sourceBucket: 'my-bucket',
    s3SourceDirectory: 'files',
    options
  });
}

await deleteSomeFiles();
```

### deleteS3File
* `deleteS3File(parameters)`: <Promise> Delete a file from a S3 location
#### parameters properties
  * `sourceBucket` (string) `required`: Name of the S3 bucket where the directory originated.
  * `s3SourceFile` (string) `required`: S3 key to delete.
  * `versionId` (string) : Version ID of the file if this is a versioned bucket.
  * `options` (object) `optional`:
    * `MFA` (string)
    * `RequestPayer` (string)
    * `exclude` (array of strings)
#### Example
```bash
  # this deletes s3://bucketA/files/someFile.txt
  async function deleteAFile() {
    await rhinocloud.s3.moveS3File({
      sourceBucket: 'bucketA',
      s3SourceFile: 'files/someFile.txt',
    });
  }
  await deleteAFile();
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
    * `exclude` (array of strings)
    * `throttleInterval` (number): Ms of delay in between S3 requests for each file
#### Example
```bash
# upload a folder called "localFolder" to s3://your-s3-bucket/localFolder/
async function uploadFolder() {
  const additionalOptions = {
    acl: 'public-read'
  };

  await rhinocloud.s3.uploadS3Directory({
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

  await rhinocloud.s3.uploadS3Directory({
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
  await rhinocloud.s3.uploadS3File({
    bucket: 'your-s3-bucket',
    s3FileName: 'files/test.txt',
    sourceFileName: 'test.txt'
  });
}

upload();
```