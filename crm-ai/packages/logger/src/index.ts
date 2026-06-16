import pino from "pino";
import pretty from "pino-pretty";

const isProd = process.env.NODE_ENV === "production";

const stream = isProd
  ? undefined
  : pretty({
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    });

export const logger = stream ? pino({}, stream) : pino();
