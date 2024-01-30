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
  heuresCM: { type: Number, default: 0 },
  professeurCM: {
    type: mongoose.Schema.ObjectId,
    ref: "Professeur",
  },
  professeurTP: {
    type: mongoose.Schema.ObjectId,
    ref: "Professeur",
  },
  heuresTP: { type: Number, default: 0 },
  professeurTD: {
    type: mongoose.Schema.ObjectId,
    ref: "Professeur",
  },
  heuresTD: { type: Number, default: 0 },
});
elementSchema.pre("validate", async function (next) {
  try {
    if (this.professeurCM == undefined) {
      this.professeurCM = undefined;
    }
    if (this.professeurTP == undefined) {
      this.professeurTP = undefined;
    }
    if (this.professeurTD == undefined) {
      this.professeurTD = undefined;
    }
  } catch (error) {
    next(error);
  }
});
/* ---------------------------------------------------------------------------------------------------------SAVE MDL------------------------- */
/* elementSchema.pre("save", async function (next) {
  next();
}); */

elementSchema.post("findOneAndDelete", async function (element) {
  console.log(" element remove midleweere work ....................");
  const Cours = require("./cours");
  const Emploi = require("./emploi");

  await Cours.deleteMany({ element: element._id });
  await Emploi.deleteMany({ element: element._id });
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
  let profCM_id = "";
  let profTD_id = "";
  let profTP_id = "";
  const Professeur = require("./professeur");
  const professeurCM = await Professeur.findById(this.professeurCM);
  const professeurTP = await Professeur.findById(this.professeurTP);
  const professeurTD = await Professeur.findById(this.professeurTD);
  if (professeurCM) {
    profCM_user = await professeurCM.getInformation();
    if (profCM_user) {
      profCM_id = professeurCM._id;
      profCM = `${profCM_user[1]} ${profCM_user[2]}`;
    }
  }
  if (professeurTP) {
    profTP_user = await professeurTP.getInformation();
    if (profTP_user) {
      profTP_id = professeurTP._id;
      profTP = `${profTP_user[1]} ${profTP_user[2]}`;
    }
  }
  if (professeurTD) {
    profTD_user = await professeurTD.getInformation();
    if (profTD_user) {
      profTD_id = professeurTD._id;
      profTD = `${profTD_user[1]} ${profTD_user[2]}`;
    }
  }

  return [profCM, profTP, profTD];
};
module.exports = mongoose.model("Element", elementSchema);
