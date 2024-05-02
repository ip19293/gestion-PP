const mongoose = require("mongoose");
const Professeur = require("../models/professeur");
const Cours = require("../models/cours");
const sendEmail = require("../utils/email");
const e = require("cors");
const paiementSchema = mongoose.Schema(
  {
    date: {
      type: Date,
      select: true,
      default: Date.now(),
    },
    fromDate: {
      type: Date,
      select: true,
      required: true,
    },
    toDate: {
      type: Date,
      select: true,
      required: true,
    },
    somme: {
      type: Number,
      select: true,
      required: true,
    },

    nbc: {
      type: Number,
      select: true,
      required: true,
    },
    nbh: {
      type: Number,
      select: true,
      required: true,
    },
    th: {
      type: Number,
      select: true,
      required: true,
    },

    professeur: {
      type: mongoose.Schema.ObjectId,
      ref: "Professeur",
      required: [true, "professeur est requis !"],
    },
    status: {
      type: String,
      required: true,
      default: "initialisé",
      enum: ["initialisé", "validé", "terminé"],
    },
    confirmation: {
      type: String,
      default: "vide",
      enum: ["vide", "accepté", "refusé"],
    },
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
/* =====================================================================MIDLWERE */
paiementSchema.pre("validate", async function (next) {
  try {
    if (
      ["vide", "refusé"].includes(this.confirmation) &&
      ["validé", "terminé"].includes(this.status)
    ) {
      return next(
        new AppError(
          "Paiement vide ou refusé ne peut pas étre validé ou  terminé ....",
          404
        )
      );
    }
  } catch (error) {
    next(error);
  }
});
//change list cours between fromDate and toDate to paied prepare ----------------------------------------
paiementSchema.pre("save", async function (next) {
  console.log(" paiement save midleweere work ....................");
  let filter = queryFilter(
    this.professeur,
    this.fromDate,
    this.toDate,
    "effectué",
    "en attente"
  );
  await Cours.updateMany(filter, { $set: { isPaid: "préparé" } });

  next();
});
//find one and delete mildweere to update liste of cours corespondate ----------------------------------------
paiementSchema.post("findOneAndDelete", async function (paiement) {
  console.log(" paiement remove midleweere work ....................");
  let filter = queryFilter(
    paiement.professeur,
    paiement.fromDate,
    paiement.toDate,
    "effectué",
    "préparé"
  );
  await Cours.updateMany(filter, {
    $set: { isPaid: "en attente" },
  });
});
paiementSchema.post("save", async function (paiement, next) {
  const professeur = await Professeur.findById(paiement.professeur);
  const message = `Nouvelle facture de  paiement non  validée ? Connectez-vous a votre compte et  validez la facture .\n`;
  try {
    await sendEmail({
      email: professeur.email,
      subject: ` Une facture de paiement non validée`,
      message,
    });
  } catch (error) {
    /*     return next(
        new AppError("échec de l'envoi de l'e-mail . réessayez plus tard !", 500)
      ); */
  }
  next();
});
// find populate midlweere -------------------------------------------------------
paiementSchema.pre(/^find/, function (next) {
  this.populate({ path: "professeur" });
  next();
});
/* ===========================================================================================METHODS ========================= */

paiementSchema.methods.setConfirmation = function (value) {
  this.confirmation = value;
};
paiementSchema.methods.setStatus = function (value) {
  this.status = value;
};

// functions ----------------------------------------------------------------
const queryFilter = function (professeur, debit, fin, signed, paid) {
  let debitDate = new Date(debit);
  let finDate = new Date(fin);
  const queryMatch =
    debit !== undefined && fin !== undefined
      ? {
          date: { $gte: debitDate, $lte: finDate },
          professeur: new mongoose.Types.ObjectId(professeur),
          isSigned: signed,
          isPaid: paid,
        }
      : {
          professeur: new mongoose.Types.ObjectId(professeur),
          isSigned: signed,
          isPaid: paid,
        };

  return queryMatch;
};
module.exports = mongoose.model("Paiement", paiementSchema);
