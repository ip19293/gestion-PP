const mongoose = require("mongoose");
const Professeur = require("./professeur");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");
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

    element: {
      type: mongoose.Schema.ObjectId,
      ref: "Element",
      required: [true, "element est requis"],
    },
    signedBy: { type: String },
    isSigned: {
      type: String,
      default: "en attente",
      enum: ["effectué", "en attente", "annulé"],
    },
    isPaid: {
      type: String,
      default: "en attente",
      enum: ["en attente", "préparé", "effectué"],
    },
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// VALIDATE MIDLWERE =========================================================================
/* coursSchema.pre("validate", async function (next) {
  const Element = require("./element");
  try {
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
      this.isSigned == "en attente" &&
      ["effectué", "préparé"].includes(this.isPaid)
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
  // next();
}); */
//POPULATE FIND QUERY ---------------------------------------------------
coursSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: "element",
      select: "name code",
    },
    {
      path: "professeur",
      select: "user",
      populate: {
        path: "user",
        select: "-__v -nom",
      },
    },
  ]);

  next();
});
// PRE SAVE MIDLEWEERE ==============================================================================
coursSchema.pre("save", async function (next) {
  const Element = require("./element");
  const element = await Element.findById(this.element);
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
  this.th = tauxHoreure;
  this.somme = sommeUM;

  next();
});
// POST SAVE MIDLEWEERE ==============================================================================
coursSchema.post("save", async function (cours, next) {
  const professeur = await Professeur.findById(cours.professeur);
  const professeur_cours = await this.constructor.find({
    professeur: cours.professeur,
    isSigned: "en attente",
  });
  let message = `Nouveaux cours à  signer ? Connectez-vous a votre compte et signez les cours non signées.\n

  `;
  if (professeur_cours.length > 0) {
    try {
      await sendEmail({
        email: professeur.email,
        subject: ` ${professeur_cours.length} Cours à signer`,
        message,
      });
    } catch (error) {
      /*     return next(
        new AppError("échec de l'envoi de l'e-mail . réessayez plus tard !", 500)
      ); */
    }
  }

  next();
});

// POST FIND ONE AND UPDATE MIDLEWEERE ==========================================================================
coursSchema.post("findOneAndUpdate", async function (cours, next) {
  let professeur = await Professeur.findById(cours.professeur);
  if (cours.isSigned === "annulé" && cours.signedBy != "admin") {
    message = `Vous avez signé un cours qui n'a pas été fait ,le superviseur a remis votre signature .\n Veuillez toujours confirmer avant de signer .`;
    try {
      await sendEmail({
        email: professeur.email,
        subject: ` Votre signature a été annulé `,
        message,
      });
    } catch (error) {}
  }

  next();
});
//GET TAUX HOURAIRE AND SOMME METHOD ----------------------------------------------------------------
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

module.exports = mongoose.model("Cours", coursSchema);
