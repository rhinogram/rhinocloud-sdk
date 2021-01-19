module.exports.getCloudFormationParameters = (params = []) => params.map((p) => {
    const { key, value } = p;
    return {
      ParameterKey: key,
      ParameterValue: value,
    };
  });


module.exports.getOptions = ({
  waitToComplete = true,
  parameters = [],
  enableTerminationProtection = false,
  timeout,
  protectedResourceTypes = [],
  notificationArns = [],
  onFailure = 'ROLLBACK',
}) => ({
  waitToComplete,
  parameters,
  enableTerminationProtection,
  timeout,
  protectedResourceTypes,
  notificationArns,
  onFailure,
});
