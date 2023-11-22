const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
const connectionDB = async () => {
  mongoose.set("strictQuery", false);
  mongoose
    .connect(process.env.MONGOOSE_URI1)
    .then(() => {
      console.log("Connect to mongodb and listening on port 5000");
    })
    .catch((errer) => {
      console.log(errer);
    });
};

module.exports = connectionDB;
