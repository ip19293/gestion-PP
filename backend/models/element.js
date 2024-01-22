const mongoose = require("mongoose");

const elementSchema = mongoose.Schema({
  semestre: {
    type: mongoose.Schema.ObjectId,
    ref: "Semestre",
    required: [true, "Le semestre est requis !"],
  },
  matiere: {
    type: mongoose.Schema.ObjectId,
    ref: "Matiere",
    required: [true, "Le matiére est requis !"],
  },
  creditCM: { type: Number, default: 0 },
  professeurCM: {
    type: mongoose.Schema.ObjectId,
    ref: "Professeur",
  },
  professeurTP: {
    type: mongoose.Schema.ObjectId,
    ref: "Professeur",
  },
  creditTP: { type: Number, default: 0 },
  professeurTD: {
    type: mongoose.Schema.ObjectId,
    ref: "Professeur",
  },
  creditTD: { type: Number, default: 0 },
});
/* ---------------------------------------------------------------------------------------------------------SAVE MDL------------------------- */
elementSchema.pre("save", async function (next) {
  next();
});

elementSchema.methods.getSemestre_Filiere_Matiere = async function () {
  const Matiere = require("./matiere");
  const Semestre = require("./semestre");
  const Filliere = require("./filliere");
  try {
    const matiere = await Matiere.findById(this.matiere);
    const semestre = await Semestre.findById(this.semestre);
    const filliere = await Filliere.findById(semestre.filliere);
    return [semestre.numero, filliere.name, matiere.name];
  } catch (error) {}
};
elementSchema.methods.getProfCM_ProfTP_ProfTD = async function () {
  let profCM = "ll n'y a pas";
  let profTP = "ll n'y a pas";
  let profTD = "ll n'y a pas";
  const Professeur = require("./professeur");
  const professeurCM = await Professeur.findById(this.professeurCM);
  const professeurTP = await Professeur.findById(this.professeurTP);
  const professeurTD = await Professeur.findById(this.professeurTD);
  if (professeurCM) {
    profCM_user = await professeurCM.getInformation();
    if (profCM_user) profCM = `${profCM_user[1]} ${profCM_user[2]}`;
  }
  if (professeurTP) {
    profTP_user = await professeurTP.getInformation();
    if (profTP_user) profTP = `${profTP_user[1]} ${profTP_user[2]}`;
  }
  if (professeurTD) {
    profTD_user = await professeurTD.getInformation();
    if (profTD_user) profTD = `${profTD_user[1]} ${profTD_user[2]}`;
  }

  return [profCM, profTP, profTD];
};
module.exports = mongoose.model("Element", elementSchema);
