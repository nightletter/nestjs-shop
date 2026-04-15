module.exports = async () => {
  require('reflect-metadata');
  require('ts-node').register({
    project: './tsconfig.json',
  });
  const { initializeTransactionalContext } = require('typeorm-transactional');
  initializeTransactionalContext();
};
