const mongoose = require("mongoose");
const Professeur = require("./professeur");
const Matiere = require("./matiere");
const AppError = require("../utils/appError");
const emploiSchema = mongoose.Schema({
  types: [
    {
      name: {
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
    },
  ],
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
    let dt = types_TO_th_nbh_nbm_thsm(this.types);
    let nbh = dt[1];
    if (
      this.types[0].nbh != 0 &&
      this.types[1].nbh != 0 &&
      this.types[2].nbh != 0
    ) {
      return next(
        new AppError("Un cours ne peut pas contient plus de deux type !", 404)
      );
    }
    if (nbh > 3) {
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
  let dt = types_TO_th_nbh_nbm_thsm(this.types);
  let nbh = dt[1];
  let nbm = dt[2];
  const fnshDate = new Date();
  fnshDate.setHours(hour + nbh, minute + nbm, 0);
  let finishtime = "";
  if (fnshDate.getMinutes() < 10) {
    finishtime = fnshDate.getHours() + ":0" + fnshDate.getMinutes();
  } else {
    finishtime = fnshDate.getHours() + ":" + fnshDate.getMinutes();
  }
  this.finishTime = finishtime;

  next();
});
/* ----------------------------------------------------------FONCTIONS----------------------- */
const types_TO_th_nbh_nbm_thsm = (types) => {
  let th = 0;
  let nbh = 0;
  let nbm = 0;
  let thsm = 0;
  types.forEach((e) => {
    if (e.name == "CM") {
      th = th + e.nbh;
    }
    if (e.name == "TD" || e.name == "TP") {
      th = th + (e.nbh * 2) / 3;
    }
    thsm = th + thsm;
    nbh = nbh + e.nbh;
  });
  nbm = (nbh % 1) * 60;

  return [th, nbh, nbm, thsm];
};

/* ---------------------------------------------------------------------get day name methods---------------------- */
emploiSchema.methods.getDayName = async function (index) {
  let daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return daysOfWeek[index];
};
emploiSchema.methods.getProfesseurMatiere = async function () {
  const prof = await Professeur.findById(this.professeur);
  const matiere = await Matiere.findById(this.matiere);

  let res = [prof._id, prof.nomComplet, matiere._id, matiere.name];

  return res;
};
module.exports = mongoose.model("Emploi", emploiSchema);
