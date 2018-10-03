const { S3 } = require('aws-sdk');
const apiVersions = require('../../apiVersions.json');
const { getS3UploadParameters, getS3MoveParameters, getS3DeleteParameters } = require('./toolbox/action.tools');
const {
  getFilePathsFromDirectory,
  writeFileFromStream,
  getFileNameFromS3Key
} = require('./toolbox/file.tools');
const { debugLog } = require('../helpers.js');

function s3Wrapper({ accessKeyId, secretAccessKey, region }) {
  const s3 = new S3({
    apiVersion: apiVersions.S3,
    accessKeyId,
    secretAccessKey,
    region
  });

  // ---------------------------- API functions --------------------------- //
  async function listBuckets() {
    const { Buckets } = await s3.listBuckets().promise();
    return Buckets;
  }

  async function getBucket({ bucket, prefix = undefined } = {}) {
    if (!bucket) {
      rej(`getBucket() requires bucket property`);
    }
    const listParams = {
      Bucket: bucket,
      ...!!prefix && { Prefix: prefix },
    };
    const { Contents } = await s3.listObjectsV2(listParams).promise();
    return Contents;
  }

  async function downloadS3File({ bucket, s3FileName, destinationFileName } = {}) {
    if (!bucket || !s3FileName || !destinationFileName) {
      rej(`downloadS3File() requires parameters properties`);
    }
    const getParams = {
      Bucket: bucket,
      Key: s3FileName
    };
    const readStream = s3.getObject(getParams).createReadStream();
    await writeFileFromStream(readStream, destinationFileName);
  }

  async function uploadS3Directory({ bucket, s3Location, sourceDirectory, options={} } = {}) {
    if (!bucket || (s3Location === undefined || s3Location === null) || !sourceDirectory) {
      throw new Error(`uploadS3Directory() requires parameters properties: bucket, s3Location, and sourceDirectory`);
    } else {
      const excludeFiles = options.exclude || [];
      const filePathsArr = getFilePathsFromDirectory(sourceDirectory, excludeFiles);
      for (const filePath of filePathsArr) {
        // this allows the use of directory or directory/
        const slash = s3Location[s3Location.length - 1] === '/' ? '' : '/';
        const fullS3FilePath = `${s3Location}${slash}${filePath}`;
        const s3UploadOptions = getS3UploadParameters({ bucket, key: fullS3FilePath, filePathToUplodad: filePath, options });
        const waitInterval = options.throttleInterval || 100;
        await new Promise((res) => setTimeout(res, waitInterval));
        await s3.putObject(s3UploadOptions).promise();
        debugLog(`${filePath} to ${fullS3FilePath}`);
      }
    }
  }

  async function uploadS3File({ bucket, s3FileName, sourceFileName, options={} } = {}) {
    if (!bucket || !s3FileName || !sourceFileName) {
      throw new Error(`uploadS3File() requires parameters properties: bucket, s3FileName, and sourceFileName`);
    } else {
      const s3UploadOptions = getS3UploadParameters({ bucket, key: s3FileName, filePathToUpload: sourceFileName, options });
      const resp = await s3.putObject(s3UploadOptions).promise();
      return resp;
    }
  }

  async function moveS3Directory({ sourceBucket, s3SourceDirectory, destinationBucket, s3DestinationDirectory, options={} } = {}) {
    if (!sourceBucket || !s3SourceDirectory || !destinationBucket || (s3DestinationDirectory !== '' && !s3DestinationDirectory)) {
      throw new Error(`moveS3Directory() requires parameters: sourceBucket, s3SourceDirectory, destinationBucket, and s3DestinationDirectory`);
    } else {
      const listParams = {
        Bucket: sourceBucket,
        Prefix: s3SourceDirectory
      };
      const { Contents: keyObjects, IsTruncated } = await s3.listObjectsV2(listParams).promise();
      if (IsTruncated) {
        const { Key: Marker } = keyObjects[keyObjects.length - 1];
        keyObjects = await fetchTruncatedS3Files({ keyObjects, params: listParams, Marker });
      }
      const excludedFiles = (!!options && options.exclude) ? options.exclude : [];
      const mappedKeys = keyObjects.map((k) => (k.Key)).filter((k) => !excludedFiles.includes(k));

      for (const key of mappedKeys) {
        const fileName = getFileNameFromS3Key(key);
        // this allows the use of directory or directory/
        const slash = s3DestinationDirectory[s3DestinationDirectory.length - 1] === '/' ? '' : '/';
        const newKey = (s3DestinationDirectory !== '' && s3DestinationDirectory !== '/') ? `${s3DestinationDirectory}${slash}${fileName}` : key;
        const moveParams = {
          sourceBucket,
          s3SourceFile: key,
          destinationBucket,
          s3DestinationFile: newKey,
          options
        };

        const waitInterval = options.throttleInterval || 100;
        await new Promise((res) => setTimeout(res, waitInterval));
        await moveS3File(moveParams);
        debugLog(`moving s3://${sourceBucket}/${key} to s3://${destinationBucket}/${newKey}`);
      }
    }
  }

  async function moveS3File({ sourceBucket, s3SourceFile, destinationBucket, s3DestinationFile, options={} } = {}) {
    if (!sourceBucket || !s3SourceFile || !destinationBucket || !s3DestinationFile) {
      throw new Error(`moveS3File() requires parameters properties: sourceBucket, s3SourceFile, s3DestinationFile, and destinationBucket`);
    } else {
      const s3MoveOptions = getS3MoveParameters({ sourceBucket, destinationBucket, sourceKey: s3SourceFile, destinationKey: s3DestinationFile, options });
      const resp = await s3.copyObject(s3MoveOptions).promise();

      // check for this to ensure the promise resolves before deleting
      if (!!resp) {
        const deleteParams = {
          Bucket: sourceBucket,
          Key: s3SourceFile
        };
        await s3.deleteObject(deleteParams).promise();
      }

      const newFileData = { newLocation: `s3://${destinationBucket}/${s3DestinationFile}` };
      return newFileData;
    }
  }


  async function copyS3Directory({ sourceBucket, s3SourceDirectory, destinationBucket, s3DestinationDirectory, options={} } = {}) {
    if (!sourceBucket || !s3SourceDirectory || !destinationBucket || (s3DestinationDirectory !== '' && !s3DestinationDirectory)) {
      throw new Error(`copyS3Directory() requires parameters: sourceBucket, s3SourceDirectory, destinationBucket, and s3DestinationDirectory`);
    } else {
      const listParams = {
        Bucket: sourceBucket,
        Prefix: s3SourceDirectory
      };
      let { Contents: keyObjects, IsTruncated, NextContinuationToken } = await s3.listObjectsV2(listParams).promise();
      if (IsTruncated) {
        keyObjects = await fetchTruncatedS3Files({ keyObjects, params: listParams, NextContinuationToken });
      }
      const excludedFiles = (!!options && options.exclude) ? options.exclude : [];
      const mappedKeys = keyObjects.map((k) => (k.Key)).filter((k) => !excludedFiles.includes(k));
      for (const key of mappedKeys) {
        const fileName = getFileNameFromS3Key(key);
        // this allows the use of directory or directory/
        const slash = s3DestinationDirectory[s3DestinationDirectory.length - 1] === '/' ? '' : '/';
        const newKey = (s3DestinationDirectory !== '' && s3DestinationDirectory !== '/') ? `${s3DestinationDirectory}${slash}${fileName}` : key;
        const copyParams = {
          sourceBucket,
          s3SourceFile: key,
          destinationBucket,
          s3DestinationFile: newKey,
          options
        };

        const waitInterval = options.throttleInterval || 100;
        await new Promise((res) => setTimeout(res, waitInterval));
        await copyS3File(copyParams);
        debugLog(`copying s3://${sourceBucket}/${key} to s3://${destinationBucket}/${newKey}`);
      }
    }
  }

  async function copyS3File({ sourceBucket, s3SourceFile, destinationBucket, s3DestinationFile, options={} } = {}) {
    if (!sourceBucket || !s3SourceFile || !destinationBucket || !s3DestinationFile) {
      throw new Error(`copyS3File() requires parameters properties: sourceBucket, s3SourceFile, s3DestinationFile, and destinationBucket`);
    } else {
      const s3MoveOptions = getS3MoveParameters({ sourceBucket, destinationBucket, sourceKey: s3SourceFile, destinationKey: s3DestinationFile, options });
      await s3.copyObject(s3MoveOptions).promise();
      const newFileData = { newLocation: `s3://${destinationBucket}/${s3DestinationFile}` };
      return newFileData;
    }
  }

  async function deleteS3Files({ sourceS3Bucket, sourceS3Directory, options = {} } = {}) {
    if (!sourceBucket || !s3SourceFile) {
      throw new Error('deleteS3Files() requires parameter properties: sourceBucket, s3SourceFile');
    } else {
      const listVersionParams = {
        Bucket: sourceBucket,
        Prefix: sourceS3Directory,
      };
      let { Versions: versionArrays, VersionIdMarker, NextKeyMarker, IsTruncated } = await s3.listVersions(listVersionParams).promise();
      if (IsTruncated) {
        versionArrays = await fetchTruncatedVersionS3Files({
          params: listVersionParams,
          KeyMarker: NextKeyMarker,
          VersionMarker: VersionIdMarker,
          keyObjectsCumlative: keys
        });
      }
      for (const versionArray in versionArrays) {
        const excludedFiles = (!!options && options.exclude) ? options.exclude : [];
        const mappedFiles = versionArray.map((k) => ({ Key: k.Key, VersionId: k.VersionId })).filter((k) => !excludedFiles.includes(k));
        const deleteParams =  getS3DeleteParameters({ sourceS3Bucket, sourceS3Files: mappedFiles, options })
        await s3.deleteObjects(deleteParams);
      }
    }
  }


  async function deleteS3File({ sourceS3Bucket, sourceS3File, versionId = undefined, options = {}} ={}) {
    if (!sourceBucket || !s3SourceFile) {
      throw new Error('deleteFile() requires parameter properties: ')
    }
    const s3DeleteOptions = getS3DeleteParameters({ sourceS3Bucket, sourceS3File, sourceS3VersionId: versionId, options });
    await s3.deleteObject(s3DeleteOptions);
    debugLog(`deleting s3://${sourceBucket}/${s3SourceFile}`);
  }

  async function fetchTruncatedS3Files({ keyObjects, params, NextContinuationToken, keyObjectsCumlative = [] } = {}) {
    const newParams = {...params, ContinuationToken: NextContinuationToken };
    let keys = keyObjectsCumlative.length !== 0 ? keyObjectsCumlative : keyObjects;
    let { Contents: newKeys, IsTruncated, NextContinuationToken } = await s3.listObjectsV2(newParams).promise();
    keys = [...keys, ...newKeys];
    if (IsTruncated) {
      return fetchTruncatedS3Files({ params: newParams, NextContinuationToken, keyObjectsCumlative: keys });
    }
    return keys
  }

  async function fetchTruncatedVersionS3Files({ keyObjects, params, KeyMarker, VersionMarker, keyObjectsCumlative = [] } = {}) {
    const newParams = {...params, ContinuationToken: NextContinuationToken };
    let keys = keyObjectsCumlative.length !== 0 ? keyObjectsCumlative : keyObjects;
    let { Versions: newKeyArray, IsTruncated, NextKeyMarker, VersionIdMarker } = await s3.listObjectVersions(newParams).promise();
    keys = [...keys, newKeyArray ];
    if (IsTruncated) {
      return fetchTruncatedVersionS3Files({
        params: newParams,
        KeyMarker: NextKeyMarker,
        VersionMarker: VersionIdMarker,
        keyObjectsCumlative: keys
      });
    }
    return keys
  }

  // ------------------------ expose functions ------------------------- //
  this.listBuckets = listBuckets;
  this.getBucket = getBucket;
  this.downloadS3File = downloadS3File;
  this.uploadS3File = uploadS3File;
  this.uploadS3Directory = uploadS3Directory;
  this.moveS3File = moveS3File;
  this.moveS3Directory = moveS3Directory;
  this.copyS3Directory = copyS3Directory;
  this.copyS3File = copyS3File;
  this.deleteS3Files = deleteS3Files;
  this.deleteS3File = deleteS3File;
}

// ------------------------------- export ----------------------------- //
s3Wrapper.prototype = Object.create(s3Wrapper.prototype);
s3Wrapper.prototype.constructor = s3Wrapper;

module.exports = s3Wrapper;
