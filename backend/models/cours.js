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
    },
    /*   matiere: {
      type: mongoose.Schema.ObjectId,
      ref: "Matiere",
      required: [true, "matiére est requis"],
    }, */
    element: {
      type: mongoose.Schema.ObjectId,
      ref: "Element",
      required: [true, "element est requis"],
    },
    group: {
      type: mongoose.Schema.ObjectId,
      ref: "Group",
      required: [true, "le group est requis !"],
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
/* coursSchema.pre("validate", async function (next) {
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
    //next(error);
  }
  next();
}); */
coursSchema.pre("save", async function (next) {
  const Element = require("./element");
  const element = await Element.findById(this.element);
  let type = element["professeur" + this.type];
  let professeur = await Professeur.findById(type);

  this.professeur = professeur._id;
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
  const Element = require("./element");
  const Matiere = require("./matiere");
  try {
    const element = await Element.findById(this.element);
    const matiere = await Matiere.findById(element.matiere);
    let tauxHoreure = 0;
    if (this.type == "CM") {
      tauxHoreure = this.nbh;
    } else {
      tauxHoreure = (this.nbh * 2) / 3;
    }

    let matiere_info = await matiere.getCodePrixCNameCCode();
    let sommeUM = tauxHoreure * matiere_info[1];
    return [tauxHoreure, sommeUM];
  } catch (error) {
    console.log(error);
  }
};
coursSchema.methods.getProfesseurMatiere = async function () {
  const Element = require("./element");
  const element = await Element.findById(this.element);
  let type = element["professeur" + this.type];
  let professeur = await Professeur.findById(type);
  let prof_info = await professeur.getInformation();
  const matiere = await Matiere.findById(element.matiere);
  let res = [
    prof_info[0],
    prof_info[1],
    prof_info[2],
    matiere._id,
    matiere.name,
  ];

  return res;
};
module.exports = mongoose.model("Cours", coursSchema);
