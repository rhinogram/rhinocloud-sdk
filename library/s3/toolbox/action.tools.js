const { convertFilePathToBuffer } = require('./file.tools');

module.exports.getS3UploadParameters = (bucket, key, filePathToUpload, options={}) => {
  if (!bucket || !key) {
    throw new Error(`S3 Upload options must include bucket and key`);
  } else {
    return {
      Bucket: bucket,
      Key: key,
      Body: convertFilePathToBuffer(filePathToUpload),
      ACL: options.acl || 'private',
      StorageClass: options.storageClass || 'STANDARD',
      ...options.cacheControl && { CacheControl: options.cacheControl },
      ...options.contentDisposition && { ContentDisposition: options.contentDisposition },
      ...options.contentEncoding && { ContentEncoding: options.contentEncoding },
      ...options.contentLanguage && { ContentLanguage: options.contentLanguage },
      ...options.contentLength && { ContentLength: options.contentLength },
      ...options.contentMd5 && { ContentMD5: options.contentMd5 },
      ...options.contentType && { ContentType: options.contentType },
      ...options.expires && { Expires: options.expires },
      ...options.grantFullControl && { GrantFullControl: options.grantFullControl },
      ...options.grantRead && { GrantRead: options.grantRead },
      ...options.grantReadAcp && { GrantReadACP: options.grantReadAcp },
      ...options.grantWriteAcp && { GrantWriteCP: options.grantWriteAcp },
      ...options.metadata && { MetaData: options.metadata },
      ...options.sseCustomerAlgorithm && { SSECustomerAlgorithm: options.sseCustomerAlgorithm },
      ...options.sseCustomerKey && { SSECustomerKey: options.sseCustomerKey },
      ...options.sseCustomerKeyMd5 && { SSECustomerKeyMD5: options.sseCustomerKeyMd5 },
      ...options.sseKmsKeyId && { SSEKMSKeyId: options.sseKmsKeyId },
      ...options.serverSideEncryption && { ServerSideEncryption: options.serverSideEncryption },
      ...options.tagging && { Tagging: options.tagging },
      ...options.websiteRedirectLocation && { WebsiteRedirectLocation: options.websiteRedirectLocation }
    };
  }
};

module.exports.getS3MoveParameters = (sourceBucket, destinationBucket, sourceKey, destinationKey, options={}) => {
  if (!sourceBucket || !destinationBucket || !sourceKey || !destinationKey) {
    throw new Error(`S3 Move parameters requires sourceBucket, destinationBucket, sourceKey, and destinationKey`);
  } else {
    return {
      Bucket: destinationBucket,
      CopySource: `${sourceBucket}/${sourceKey}`,
      Key: destinationKey,
      ACL: options.acl || 'private',
      StorageClass: options.storageClass || 'STANDARD',
      ...options.cacheControl && { CacheControl: options.cacheControl },
      ...options.contentDisposition && { ContentDisposition: options.contentDisposition },
      ...options.contentEncoding && { ContentEncoding: options.contentEncoding },
      ...options.contentLanguage && { ContentLanguage: options.contentLanguage },
      ...options.contentType && { ContentType: options.contentType },
      ...options.copySourceIfMatch && { CopySourceIfMatch: options.copySourceIfMatch },
      ...options.copySourceIfModifiedSince && { CopySourceIfModifiedSince: options.copySourceIfModifiedSince },
      ...options.copySourceIfNoneMatch && { CopySourceIfNoneMatch: options.copySourceIfNoneMatch },
      ...options.copySourceIfUnmodifiedSince && { CopySourceIfUnmodifiedSince: options.copySourceIfUnmodifiedSince },
      ...options.copySourceSSECustomerAlgorithm && { CopySourceSSECustomerAlgorithm: options.copySourceSSECustomerAlgorithm },
      ...options.copySourceSSECustomerKeyMd5 && { CopySourceSSECustomerKeyMD5: options.copySourceSSECustomerKeyMd5 },
      ...options.expires && { Expires: options.expires },
      ...options.grantFullControl && { GrantFullControl: options.grantFullControl },
      ...options.grantRead && { GrantRead: options.grantRead },
      ...options.grantReadAcp && { GrantReadACP: options.grantReadAcp },
      ...options.grantWriteAcp && { GrantWriteCP: options.grantWriteAcp },
      ...options.metadata && { MetaData: options.metadata },
      ...options.metadataDirective && { MetadataDirective: options.metadataDirective || 'COPY' },
      ...options.sseCustomerAlgorithm && { SSECustomerAlgorithm: options.sseCustomerAlgorithm },
      ...options.sseCustomerKey && { SSECustomerKey: options.sseCustomerKey },
      ...options.sseCustomerKeyMd5 && { SSECustomerKeyMD5: options.sseCustomerKeyMd5 },
      ...options.sseKmsKeyId && { SSEKMSKeyId: options.sseKmsKeyId },
      ...options.serverSideEncryption && { ServerSideEncryption: options.serverSideEncryption },
      ...options.tagging && { Tagging: options.tagging },
      ...options.websiteRedirectLocation && { WebsiteRedirectLocation: options.websiteRedirectLocation }
    };
  }
};
