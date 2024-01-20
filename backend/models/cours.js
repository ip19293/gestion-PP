const mongoose = require("mongoose");
const Matiere = require("./matiere");
const Professeur = require("./professeur");
const AppError = require("../utils/appError");
const coursSchema = mongoose.Schema(
  {
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
      enum: ["oui", "pas encore", "préparée"],
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
    if (this.nbh > 3) {
      return next(
        new AppError("Un cours ne peut pas durer plus de trois heures !", 404)
      );
    }
    if (
      this.isSigned == "pas encore" &&
      ["oui", "préparée"].includes(this.isPaid)
    ) {
      return next(
        new AppError(
          "Un cours non signé ne peut pas étre paiée ou préparée !",
          404
        )
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
/* =====================================================================METHODS============================== */
coursSchema.methods.getTHSomme = async function () {
  const Matiere = require("./matiere");
  const Professeur = require("./professeur");
  const professeur = await Professeur.findById(this.professeur);
  let tauxHoreure = 0;
  if (this.type == "CM") {
    tauxHoreure = this.nbh;
  } else {
    tauxHoreure = (this.nbh * 2) / 3;
  }
  const matiere = await Matiere.findById(this.matiere);
  let matiere_info = await matiere.getCodePrixCNameCCode();
  let sommeUM = tauxHoreure * matiere_info[1];
  return [tauxHoreure, sommeUM];
};

module.exports = mongoose.model("Cours", coursSchema);
