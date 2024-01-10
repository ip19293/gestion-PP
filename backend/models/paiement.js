const mongoose = require("mongoose");

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
paiementSchema.methods.setConfirmation = function (value) {
  this.confirmation = value;
};
paiementSchema.methods.setStatus = function (value) {
  this.status = value;
};
module.exports = mongoose.model("Paiement", paiementSchema);
