import log from "loglevel"; // weird... see https://github.com/pimterry/loglevel/issues/127
import { config } from "../config";

// TODO load from env
const LOG_LEVEL: log.LogLevelDesc = config.logLevel as log.LogLevelDesc;
const originalFactory = log.methodFactory;
log.methodFactory = (methodName, logLevel, loggerName) => {
  if (methodName === "debug" && logLevel <= log.levels.DEBUG) {
    return console.debug;
  }
  return originalFactory(methodName, logLevel, loggerName);
};
log.setDefaultLevel(LOG_LEVEL);

export const logger = log;
