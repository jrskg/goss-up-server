import mongoose from "mongoose";
import { DB_NAME } from "../utils/constants.js";
import { MONGO_URI } from "./env.index.js";
const connectDB = async() => {
  try {
    console.log("Connecting to database...");
    const instance = await mongoose.connect(`${MONGO_URI}/${DB_NAME}?retryWrites=true&w=majority`);
    console.log(`DATABASE CONNECTED HOST ${instance.connection.host}`);
  } catch (error) {
    console.log("DATABASE CONNECTION ERROR", error);
    process.exit(1);
  }
}

export default connectDB;