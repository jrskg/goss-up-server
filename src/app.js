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
//Use routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/friendship", friendshipRoute);


app.use(error);
export default app;