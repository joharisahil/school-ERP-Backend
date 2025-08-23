// import mongoose from "mongoose";

// export const dbConnection = () => {
//     mongoose.connect(process.env.MONGO_URL, {
//         dbName: "SCHOOL_MANAGEMENT_SYSTEM",
//     })
//     .then(() => {
//         console.log("Connected to database");
//     })
//     .catch((error) => {
//         console.log(error);
//         console.log("Error occured while connecting to database");
//     });
// };

import mongoose from "mongoose";

export const dbConnection = () => {
  mongoose
    .connect(process.env.MONGO_URL, {
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
