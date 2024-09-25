import app from "./app.js";
import connectDB from "./configs/db.js";
import { PORT } from "./configs/env.index.js";

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.log("DATABASE CONNECTION ERROR", error);
  process.exit(1);
});
