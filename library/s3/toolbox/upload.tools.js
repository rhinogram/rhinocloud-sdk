const { convertFilePathToBuffer } = require('./file.tools');

module.exports.gets3UploadParameters = function(bucket, key, filePathToUpload, options={}) {
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
