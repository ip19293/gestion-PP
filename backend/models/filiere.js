const mongoose = require("mongoose");
const Categorie = require("./categorie");
const Matiere = require("./matiere");
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
  isPaireSemestre: {
    type: Boolean,
    default: false,
  },
  /* 
  debutSemestrePaire: {
    type: Date,
    select: true,
    default: Date.now(),
  },
  debutSemestreInPaire: {
    type: Date,
    select: true,
    default: function () {
      const start = this.start.getMonth();
      const f = new Date(this.start);
      f.setMonth(start + 4);
      return f;
    },
  }, */
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
  const Semestre = require("./facture");
  const Emploi = require("./emploi");
  const semestres = await Semestre.find({ filiere: this._id });
  for (let semestre of semestres) {
    let groups = await Group.find({ semestre: semestre._id });
    for (let group of groups) {
      let emplois = await Emploi.find({ group: group._id });
    }
  }
};
filiereSchema.post("findOneAndDelete", async function (filiere, message) {
  console.log(" filiere remove midleweere work ....................");
  const Emploi = require("./emploi");

  let groups = [];
  let emplois = [];

  for (x of groups) {
    let emploi = await Emploi.deleteMany({ semestre: x._id });
    if (emploi) {
      emplois.push(emploi);
    }
  }

  message = `La filière ${filiere.niveau} ${filiere.name} avec  ${semestres.length} semestres, ${groups.length} groups et ${emplois.length} cours d'emploi du temps est supprimé !`;
  filiere.name = message;
  console.log(message);
});

module.exports = mongoose.model("Filiere", filiereSchema);
