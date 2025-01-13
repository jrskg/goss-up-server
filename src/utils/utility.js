import { createTransport } from "nodemailer";
import {
  COOKIE_EXPIRE,
  NODE_ENV,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_USER,
} from "../configs/env.index.js";
import { ApiResponse } from "./ApiResponse.js";


export const cookieOptions = () => ({
  secure: NODE_ENV === "development" ? false : true,
  httpOnly: NODE_ENV === "development" ? false : true,
  sameSite: NODE_ENV === "development" ? false : "none",
});

export const sendToken = async (user, statusCode, res, message) => {
  const jwtToken = await user.generateJWTToken();
  user["password"] = undefined;
  res
    .status(statusCode)
    .cookie("token", jwtToken, {
      ...cookieOptions(),
      expires: new Date(Date.now() + COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    })
    .json(
      new ApiResponse(statusCode, message, user)
    );
};

export const sendEmail = async ({ toEmail, subject, link, description, btnText }) => {
  const transporter = createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.sendMail({
    to: toEmail,
    subject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            width: 30%;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          h2 {
            color: #363636;
            text-align: center;
            margin-bottom: 20px;
            font-weight: 200;
          }
          .app-name {
            color: #ff3030;
            text-align: center;
            font-size: 2rem;
            font-weight: bold;
          }
          .btn {
            background-color: #18c9ff;
            color: #000000;
            text-align: center;
            padding: 10px;
            border-radius: 5px;
            text-decoration: none;
            margin-top: 20px;  
            width: 50%;    
            font-weight: bold;
          }
        </style>
      </head>

      <body>
        <div class="container">
          <p class="app-name">Goss Up</p>
          <h2>${description}</h2>
          <a class="btn" href="${link}">${btnText}</a>
        </div>
      </body>

      </html>
    `,
  });
};

export const sortUserIds = (a, b) => {
  let smallerId = a.toString();
  let biggerId = b.toString();
  return smallerId > biggerId ? [biggerId, smallerId] : [smallerId, biggerId];
};

export const getFileType = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "other";
};