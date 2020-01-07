import log from 'loglevel'; // weird... see https://github.com/pimterry/loglevel/issues/127


// TODO load from env
const LOG_LEVEL: log.LogLevelDesc = 'debug';
log.setDefaultLevel(LOG_LEVEL);

export const logger = log;