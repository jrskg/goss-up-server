import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { FRONTEND_URL } from "./configs/env.index.js";
import { error } from "./middlewares/error.middlewares.js";

const app = express();

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Goss-up server is up and running");
});

//Import routes
import userRoute from "./routes/user.route.js";
import friendshipRoute from "./routes/friendship.route.js";
import chatRoute from "./routes/chat.route.js";
import messageRoute from "./routes/message.route.js";
//Use routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/friendship", friendshipRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/message", messageRoute);

app.use(error);
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});
export default app;