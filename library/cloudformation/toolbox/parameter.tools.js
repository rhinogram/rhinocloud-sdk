module.exports.getCloudFormationParameters = (params = []) => params.map((p) => {
    const { key, value } = p;
    return {
      ParameterKey: key,
      ParameterValue: value,
    };
  });


module.exports.getOptions = (options = {}) => ({
    waitToComplete: (options.waitToComplete === undefined) ? true : !!options.waitToComplete,
    parameters: options.parameters || [],
    enableTerminationProtection: (options.enableTerminationProtection === undefined) ? false : !!options.enableTerminationProtection,
  });
