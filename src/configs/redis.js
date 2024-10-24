import ioredis from "ioredis";
import { REDIS_HOST, REDIS_PASSWORD, REDIS_USER } from "./env.index.js";

const pub = new ioredis({
  host:REDIS_HOST,
  port:6379,
  username:REDIS_USER,
  password:REDIS_PASSWORD
});

const sub = new ioredis({
  host:REDIS_HOST,
  port:6379,
  username:REDIS_USER,
  password:REDIS_PASSWORD
});

export { pub, sub };