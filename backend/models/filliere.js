const mongoose = require("mongoose");
const Categorie = require("../models/categorie");
const Matiere = require("../models/matiere");
const group = require("./group");
const filiereSchema = mongoose.Schema({
  name: { type: String, required: true, lowercase: true },
  niveau: {
    type: String,
    default: "licence",
    enum: ["licence", "master", "doctorat"],
  },
  description: {
    type: String,
    default: "",
  },
});

filiereSchema.methods.getPeriodePlace = function () {
  let periode = 0;
  let niveaus = ["licence", "master", "doctorat"];
  let place = niveaus.findIndex((niveau) => niveau == this.niveau) + 1;
  if (this.niveau != undefined) {
    if (this.niveau == "master") {
      periode = 2;
    } else {
      periode = 3;
    }
  }
  return [periode, place];
};
filiereSchema.methods.getEmplois = async function () {
  const Group = require("./group");
  const Semestre = require("./semestre");
  const Emploi = require("./emploi");
  const semestres = await Semestre.find({ filliere: this._id });
  for (let semestre of semestres) {
    let groups = await Group.find({ semestre: semestre._id });
    for (let group of groups) {
      let emplois = await Emploi.find({ group: group._id });
    }
  }
};
filiereSchema.post("findOneAndDelete", async function (filliere, message) {
  console.log(" filliere remove midleweere work ....................");
  const Semestre = require("./semestre");
  const Emploi = require("./emploi");
  const Group = require("./group");
  const semestres = await Semestre.find({ filliere: filliere._id });
  let groups = [];
  let emplois = [];
  for (x of semestres) {
    let group = await Group.deleteMany({ semestre: x._id });
    if (group) {
      groups.push(group);
    }
  }
  for (x of groups) {
    let emploi = await Emploi.deleteMany({ semestre: x._id });
    if (emploi) {
      emplois.push(emploi);
    }
  }
  await Semestre.deleteMany({ filliere: filliere._id });
  message = `La filière ${filliere.niveau} ${filliere.name} avec  ${semestres.length} semestres, ${groups.length} groups et ${emplois.length} cours d'emploi du temps est supprimé !`;
  filliere.name = message;
  console.log(message);
});

module.exports = mongoose.model("Filliere", filiereSchema);
