function getCredentialsObject(options, apiVersion) {
  const {
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    AWS_PROFILE,
  } = process.env;
  const {
    accessKeyId = AWS_ACCESS_KEY_ID,
    secretAccessKey = AWS_SECRET_ACCESS_KEY,
    region = AWS_REGION,
    profile = AWS_PROFILE,
  } = options;
  const useProfile = !!profile;

  return {
    region,
    ...useProfile && { profile },
    ...!useProfile && { accessKeyId },
    ...!useProfile && { secretAccessKey },
    ...!!apiVersion && { apiVersion },
  };
}

module.exports = {
  getCredentialsObject,
};
