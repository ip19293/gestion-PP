const mongoose = require("mongoose");
const Categorie = require("../models/categorie");
const Matiere = require("../models/matiere");
const filiereSchema = mongoose.Schema({
  name: { type: String, required: true },
  niveau: {
    type: String,
    default: "Licence",
    enum: ["Licence", "Master", "Doctorat"],
  },
  description: {
    type: String,
    default: "",
  },
  periode: {
    type: Number,
    default: 3,
    enum: [2, 3],
  },
});

filiereSchema.pre("save", async function (next) {
  if (this.niveau != undefined) {
    if (this.niveau == "Master") {
      this.periode = 2;
    } else {
      this.periode = 3;
    }
  }
  next();
});
filiereSchema.methods.nombresOfAnnes = function () {
  let periode = 0;
  if (this.niveau != undefined) {
    if (this.niveau == "Master") {
      periode = 2;
    } else {
      periode = 3;
    }
  }
  return periode;
};

filiereSchema.post("findOneAndDelete", async function (filliere) {
  console.log(" filliere remove midleweere work ....................");
  const Semestre = require("./semestre");
  const Group = require("./group");
  const semestres = await Semestre.find({ filliere: filliere._id });
  let nb = 0;
  let mm = " , ";
  for (m of semestres) {
    nb = nb + 1;
    mm = m.numero + mm;
    await Group.deleteMany({ semestre: m._id });
  }
  await Semestre.deleteMany({ filliere: filliere._id });
  console.log(
    `Successfully deleted filliere : ${filliere.name}   with his elements ${nb} semestres [${mm}] ...`
  );
});

module.exports = mongoose.model("Filliere", filiereSchema);
