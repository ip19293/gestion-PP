const mongoose = require("mongoose");
const Professeur = require("./professeur");
const Matiere = require("./matiere");
const AppError = require("../utils/appError");
const emploiSchema = mongoose.Schema({
  type: {
    type: String,
    required: [true, "Le type est requis !"],
    enum: ["CM", "TD", "TP"],
  },
  nbh: {
    type: Number,
    required: [true, "Nombre d'heures est requis !"],
    default: 1.5,
    min: 0,
    max: 3,
  },
  startTime: {
    type: String,
    select: true,
    required: true,
  },
  finishTime: {
    type: String,
    select: true,
  },
  dayNumero: {
    type: Number,
    required: [true, "Le jour est requis !"],
    select: true,
    enum: [0, 1, 2, 3, 4, 5, 6],
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: "Group",
    required: [true, "le group est requis !"],
  },
  professeur: {
    type: mongoose.Schema.ObjectId,
    ref: "Professeur",
    required: [true, "enseignant est requis !"],
  },
  matiere: {
    type: mongoose.Schema.ObjectId,
    ref: "Matiere",
    required: [true, "matiére est requis !"],
  },
});
/* ===================================================================== validate midelwere ======================== */
emploiSchema.pre("validate", async function (next) {
  try {
    if (this.nbh > 3) {
      return next(
        new AppError("Un cours ne peut pas durer plus de trois heures !", 404)
      );
    }
  } catch (error) {
    next(error);
  }
});
/* ===================================================================== save  midelwere ======================== */
emploiSchema.pre("save", async function (next) {
  const input = this.startTime.split(":");
  let hour = parseInt(input[0]);
  let minute = parseInt(input[1]);
  const strtDate = new Date();
  strtDate.setHours(hour, minute, 0);
  let nbm = (this.nbh % 1) * 60;
  const fnshDate = new Date();
  fnshDate.setHours(hour + this.nbh, minute + nbm, 0);
  let finishtime = "";
  if (fnshDate.getMinutes() < 10) {
    finishtime = fnshDate.getHours() + ":0" + fnshDate.getMinutes();
  } else {
    finishtime = fnshDate.getHours() + ":" + fnshDate.getMinutes();
  }
  this.finishTime = finishtime;

  next();
});

/* ---------------------------------------------------------------------get day name methods---------------------- */
emploiSchema.methods.getDayName = async function () {
  let daysOfWeek = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];

  return daysOfWeek[this.dayNumero];
};
emploiSchema.methods.getProfesseurMatiere = async function () {
  const prof = await Professeur.findById(this.professeur);
  let prof_info = await prof.getInformation();
  const matiere = await Matiere.findById(this.matiere);

  let res = [prof_info[1], prof_info[2], matiere.name];

  return res;
};

emploiSchema.methods.getGName_SNum_SId_FId_FName_FNiveau_NiveauAnnee =
  async function () {
    const Group = require("./group");
    const Semestre = require("./semestre");
    const Filliere = require("./filliere");
    const group = await Group.findById(this.group);
    let group_info = await group.getSNumero_FId_FName_FNiveau_NiveauAnnee();
    let info = [];
    if (group) {
      info = [
        group.name,
        group_info[0],
        group.semestre,
        group_info[1],
        group_info[2],
        group_info[3],
        group_info[4],
      ];
    }
    return info;
  };
module.exports = mongoose.model("Emploi", emploiSchema);
