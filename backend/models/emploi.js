const mongoose = require("mongoose");
const Professeur = require("./professeur");
const Element = require("./element");
const Filiere = require("./filiere");
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
  filiere: {
    type: mongoose.Schema.ObjectId,
    ref: "Filiere",
  },
  professeur: {
    type: mongoose.Schema.ObjectId,
    ref: "Professeur",
    required: [true, "professeur est requis !"],
  },
  element: {
    type: mongoose.Schema.ObjectId,
    ref: "Element",
    required: [true, "élément est requis !"],
  },
  jour: { type: String, lowercase: true },
});
/* ===================================================================== validate midelwere ======================== */
/* emploiSchema.pre("validate", async function (next) {
  try {
    if (this.nbh > 3) {
      return next(
        new AppError("Un cours ne peut pas durer plus de trois heures !", 404)
      );
    }
    const element = await Element.findById(this.element);
    if (element) {
      let type = element["professeur" + this.type];
      console.log(type);
      let professeur = await Professeur.findById(type);
      if (!professeur) {
        return next(
          new AppError(
            `Il n'y a pas de professeur  ${this.type} de cette élément  !`,
            404
          )
        );
      }
    }
  } catch (error) {
    next(error);
  }
}); */
/* ===================================================================== save  midelwere ======================== */
emploiSchema.pre("save", async function (next) {
  const element = await Element.findById(this.element);
  let type = element["professeur" + this.type];
  /*   let professeur = await Professeur.findById(type);
  this.professeur = professeur._id; */
  this.filiere = element.filiere;
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
  /* ----------------------------------------------------------------------- */
  /*    let professeurs = element["professeur" + this.type];
   let prof = professeurs.find((el) =>
     el.equals(new mongoose.Types.ObjectId(this.professeur))
   );
 */
  let daysOfWeek = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  this.jour = daysOfWeek[this.dayNumero];
  next();
});
//FIND MIDELEWEERE TO POPULATE QUERY ---------------------------------------------------------------
emploiSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: "professeur",
      /*   select: "user",
      populate: {
        path: "user",
        select: "nom prenom",
      }, */
    },
    { path: "filiere", select: "name niveau" },
    { path: "element" },
  ]);

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

/* -------------------------------------------------------------------Get Emplois Professeurs ------------------ */
emploiSchema.methods.getEmploiProfesseurs = async function () {
  const element = await Element.findById(this.element);

  let professeurs = element["professeur" + this.type];

  // console.log(professeurs);
  return professeurs;
};
module.exports = mongoose.model("Emploi", emploiSchema);
