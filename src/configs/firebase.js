import { applicationDefault } from "firebase-admin/app";
import admin from "firebase-admin";

export const firebase = admin.initializeApp({
  credential: applicationDefault(),
});

export const sendNotification = async (token, options, data) => {
  try {
    const strData = Object.keys(data).reduce((acc, key) => {
      acc[key] = JSON.stringify(data[key]);
      return acc;
    }, {});
    await firebase.messaging().send({
      token,
      notification: options, // title, body
      data: strData,
    });
  } catch (error) {
    if (error.code === "messaging/registration-token-not-registered") {
      console.error("FCM token is invalid or not registered:", token);
    } else {
      console.error("Error sending notification:", error);
    }
  }
};
