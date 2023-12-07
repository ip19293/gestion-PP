const mongoose = require("mongoose");
const groupSchema = mongoose.Schema({
  name: {
    type: String,
    select: true,
    required: [true, "Le nom du groupe est requis !"],
    enum: ["", "A", "B", "C", "D", "E"],
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
    required: [true, "semestre est requis !"],
  },
});
groupSchema.methods.getInformation = function () {};
groupSchema.post("findOneAndDelete", async function (group) {
  console.log(" group remove midleweere work ....................");
  const Emploi = require("./emploi");
  await Emploi.deleteMany({ group: group._id });
  group.name = `le supprimé avec succés avec liste d'emploi .`;
  console.log(`${group.name}`);
});

module.exports = mongoose.model("Group", groupSchema);
