const mongoose = require("mongoose");
const Matiere = require("./matiere");
const Professeur = require("./professeur");
const AppError = require("../utils/appError");
const coursSchema = mongoose.Schema(
  {
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
    date: {
      type: Date,
      required: [true, "Date est requis !"],
    },

    startTime: {
      type: String,
      select: true,
      required: [true, "Heure de début est requis !"],
    },
    finishTime: {
      type: String,
      select: true,
    },
    professeur: {
      type: mongoose.Schema.ObjectId,
      ref: "Professeur",
      required: [true, "Enseigant est requis !"],
    },
    matiere: {
      type: mongoose.Schema.ObjectId,
      ref: "Matiere",
      required: [true, "matiére est requis"],
    },

    isSigned: {
      type: String,
      default: "pas encore",
      enum: ["oui", "pas encore"],
    },
    isPaid: {
      type: String,
      default: "pas encore",
      enum: ["oui", "pas encore"],
    },
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
/* =====================================================================MIDLWERE */
coursSchema.pre("validate", async function (next) {
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
    if (this.isSigned == "pas encore" && this.isPaid == "oui") {
      return next(
        new AppError("Un cours non signé ne peut pas étre paiée !", 404)
      );
    }
  } catch (error) {
    next(error);
  }
});
coursSchema.pre("save", async function (next) {
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
/* =====================================================================METHODS============================== */
coursSchema.methods.getInformation = async function () {
  const Matiere = require("./matiere");
  const Professeur = require("./professeur");
  const professeur = await Professeur.findById(this.professeur);
  let tauxHoreure =
    this.types[0].nbh +
    (this.types[1].nbh * 2) / 3 +
    (this.types[2].nbh * 2) / 3;
  let nbh = this.types[0].nbh + this.types[1].nbh + this.types[2].nbh;
  const matiere = await Matiere.findById(this.matiere);
  let matiere_info = await matiere.getInformation();
  let sommeUM = tauxHoreure * matiere_info[3];
  let types = [];
  for (let x of this.types) {
    if (x.nbh != 0) {
      types.push(x);
    }
  }
  return [
    professeur._id,
    professeur.nomComplet,
    professeur.email,
    professeur.mobile,
    nbh,
    tauxHoreure,
    sommeUM,
    matiere.name,
    matiere_info[3],
    types,
  ];
};
/* =====================================================================FONCTION============================== */
const types_TO_th_nbh_nbm_thsm = (types) => {
  let th = 0;
  let nbh = 0;
  let nbm = 0;
  nbh = types[0].nbh + types[1].nbh + types[2].nbh;
  th = types[0].nbh + ((types[1].nbh + types[2].nbh) * 2) / 3;
  nbm = (nbh % 1) * 60;

  return [th, nbh, nbm];
};
module.exports = mongoose.model("Cours", coursSchema);
