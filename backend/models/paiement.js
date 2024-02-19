const mongoose = require("mongoose");
const Professeur = require("../models/professeur");
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
    },
    professeur: {
      type: mongoose.Schema.ObjectId,
      ref: "Professeur",
      required: [true, "professeur est requis !"],
    },
    nbh: {
      type: Number,
      select: true,
    },
    th: {
      type: Number,
      select: true,
    },
    nbc: {
      type: Number,
      select: true,
    },
    totalMontant: {
      type: Number,
      select: true,
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
    enseignant: String,
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
paiementSchema.pre("save", async function (next) {
  const professeur = await Professeur.findById(this.professeur);

  this.enseignant = professeur.nom + " " + professeur.prenom;

  next();
});
paiementSchema.post("save", async function (paiement) {
  const professeur = await Professeur.findById(paiement.professeur);

  const message = `Nouveau paiement non  validée ? Connectez-vous a votre compte chez nous Vérifieez les notifications  puis validez .\n

  `;
  /*   if (professeur_cours.length > 0) { */
  try {
    await sendEmail({
      email: professeur.email,
      subject: ` 1 paiement pas encore validée`,
      message,
    });
  } catch (error) {
    /*     return next(
        new AppError("échec de l'envoi de l'e-mail . réessayez plus tard !", 500)
      ); */
  }
});
/* ===========================================================================================METHODS ========================= */

paiementSchema.methods.getDetail = async function () {
  const professeur = await Professeur.findById(this.professeur);
  let debit = new Date(req.body.debit);
  let fin = new Date(req.body.fin);
};
paiementSchema.methods.setConfirmation = function (value) {
  this.confirmation = value;
};
paiementSchema.methods.setStatus = function (value) {
  this.status = value;
};
module.exports = mongoose.model("Paiement", paiementSchema);
