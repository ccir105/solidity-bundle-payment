module.exports = {
  istanbulFolder: 'coverage',
  providerOptions: {
    wallet: {totalAccounts: 1000},
  },
  client: require('ganache-core'),
};
