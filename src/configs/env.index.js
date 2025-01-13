import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

export const MONGO_URI = process.env.MONGO_URI;
export const PORT = process.env.PORT;
export const CORS_ORIGINS = process.env.CORS_ORIGINS;

export const JWT_EXPIRES = process.env.JWT_EXPIRES;
export const JWT_SECRET = process.env.JWT_SECRET;

export const NODE_ENV = process.env.NODE_ENV;

export const COOKIE_EXPIRE = process.env.COOKIE_EXPIRE;

export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = process.env.SMTP_PORT;
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;

export const CLN_CLOUD_NAME = process.env.CLN_CLOUD_NAME;
export const CLN_API_KEY = process.env.CLN_API_KEY;
export const CLN_API_SECRET = process.env.CLN_API_SECRET;

export const FRONTEND_URL = process.env.FRONTEND_URL;

export const REDIS_USER = process.env.REDIS_USER;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
export const REDIS_HOST = process.env.REDIS_HOST;

export const KAFKA_BROKER = process.env.KAFKA_BROKER;

export const ATTACHMENT_SIZE_LIMIT_MB = process.env.ATTACHMENT_SIZE_LIMIT_MB
export const MAX_ATTACHMENT_COUNT = process.env.MAX_ATTACHMENT_COUNT