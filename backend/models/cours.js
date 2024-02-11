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
    th: {
      type: Number,
    },
    somme: {
      type: Number,
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
      required: [true, "professeur est requis"],
    },
    /*    matiere: {
      type: mongoose.Schema.ObjectId,
      ref: "Matiere",
    }, */
    element: {
      type: mongoose.Schema.ObjectId,
      ref: "Element",
      required: [true, "element est requis"],
    },
    matiere: String,
    enseignant: String,
    prix: Number,
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
  const Element = require("./element");
  try {
    /* ----------------------------------------------verification de element professeur by type before create-------------------------- */
    const element = await Element.findById(this.element);
    const professeur = await Professeur.findById(this.professeur);
    let professeurs = element["professeur" + this.type];
    let prof = professeurs.find((el) =>
      el.equals(new mongoose.Types.ObjectId(professeur._id))
    );
    if (!prof) {
      return next(
        new AppError(
          `Ce professeur  ne fait pas partie des professeurs de ${this.type}  pour  l'elément !`,
          404
        )
      );
    }

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
});
coursSchema.pre("save", async function (next) {
  const Element = require("./element");
  const element = await Element.findById(this.element);
  const professeur = await Professeur.findById(this.professeur);
  this.enseignant = professeur.nom + " " + professeur.prenom;
  this.matiere = element.name;
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

  let tauxHoreure = 0;
  if (this.type == "CM") {
    tauxHoreure = this.nbh;
  } else {
    tauxHoreure = (this.nbh * 2) / 3;
  }
  let prix = await element.getPrix();
  let sommeUM = tauxHoreure * prix;
  this.prix = prix;
  this.th = tauxHoreure;
  this.somme = sommeUM;
  next();
});
/*-------------------------------------------------DELETE findOneAndDelete ------------------------------------------ */

coursSchema.post("findOneAndDelete", async function (cours) {
  console.log(" cours remove midleweere work ....................");
  if (cours.isSigned === "oui") {
    const Professeur = require("./professeur");
    let professeur = await Professeur.findById(cours.professeur);
    let cours_info = await cours.getTHSomme();
    professeur.nbh = professeur.nbh - cours.nbh;
    professeur.nbc = professeur.nbc - 1;
    professeur.somme = professeur.somme - cours_info[1];
    await professeur.save();
  } /*  else {
    console.log(" Not Signed cours deleted");
  } */
});
/* =====================================================================METHODS============================== */
coursSchema.methods.getTHSomme = async function () {
  const Element = require("./element");
  try {
    const element = await Element.findById(this.element);
    let tauxHoreure = 0;
    if (this.type == "CM") {
      tauxHoreure = this.nbh;
    } else {
      tauxHoreure = (this.nbh * 2) / 3;
    }

    let prix = await element.getPrix();
    let sommeUM = tauxHoreure * prix;
    return [tauxHoreure, sommeUM];
  } catch (error) {
    console.log(error);
  }
};
coursSchema.methods.getProfesseurMatiere = async function () {
  /*   const Element = require("./element");
  const element = await Element.findById(this.element);
  let type = element["professeur" + this.type]; */
  let professeur = await Professeur.findById(this.professeur);
  let prof_info = await professeur.getUserInformation();
  let res = [prof_info.nom, prof_info.prenom, matiere._id, matiere.name];

  return res;
};
module.exports = mongoose.model("Cours", coursSchema);
