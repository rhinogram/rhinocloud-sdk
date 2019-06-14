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
}) => ({
  waitToComplete,
  parameters,
  enableTerminationProtection,
  timeout,
});
