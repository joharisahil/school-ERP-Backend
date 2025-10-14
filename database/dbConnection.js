import mongoose from "mongoose";

export const dbConnection = () => {
  mongoose
    .connect(process.env.MONGO_URL_PRODUCTION, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("✅ Connected to Local MongoDB");
    })
    .catch((error) => {
      console.error(
        "❌ Error while connecting to Local MongoDB:",
        error.message
      );
    });
};
