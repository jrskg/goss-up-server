import { applicationDefault } from "firebase-admin/app";
import admin from "firebase-admin";

export const firebase = admin.initializeApp({
  credential: applicationDefault(),
});
