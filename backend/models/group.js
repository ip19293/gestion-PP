const mongoose = require("mongoose");

const groupSchema = mongoose.Schema({
  groupName: {
    type: String,
    select: true,
    required: true,
    validate: {
      validator: function (val) {
        if (this.isOne === "YES") {
          return ["ALL"].includes(val);
        } else if (this.isOne === "NO") {
          return ["A", "B", "C", "D", "E"].includes(val);
        }
        return false;
      },
      message: "Invalid groupName for division as many groups ",
    },
  },
  isOne: {
    type: String,
    required: true,
    default: "YES",
    enum: ["YES", "NO"],
  },
  startEmploi: {
    type: Date,
    select: true,
    default: Date.now(),
  },
  finishEmploi: {
    type: Date,
    select: true,
    default: function () {
      const start = this.startEmploi.getMonth();
      const f = new Date(this.startEmploi);
      f.setMonth(start + 4);
      return f;
    },
  },
  semestre: {
    type: mongoose.Schema.ObjectId,
    ref: "Semestre",
    required: [true, "semestre is required"],
  },
});
groupSchema.post("findOneAndDelete", async function (group) {
  console.log(" group remove midleweere work ....................");
  const Emploi = require("./emploi");
  await Emploi.deleteMany({ group: group._id });
  group.groupName = `Successfully deleted group : ${group.groupName}   with his all emplois ...`;
  console.log(
    `Successfully deleted group : ${group.groupName}   with his emplois ...`
  );
});
module.exports = mongoose.model("Group", groupSchema);
