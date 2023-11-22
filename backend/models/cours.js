const mongoose = require("mongoose");
const Matiere = require("./matiere");
const Professeur = require("./professeur");
const coursSchema = mongoose.Schema(
  {
    types: [
      {
        name: {
          type: String,
          required: [true, "type is required"],
          enum: {
            values: ["CM", "TD", "TP"],
            message: "{VALUE} is not supported",
          },
        },
        nbh: {
          type: Number,
          required: true,
          default: 1.5,
        },
      },
    ],
    date: {
      type: Date,
      required: [true, "date is required"],
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
    professeur: {
      type: mongoose.Schema.ObjectId,
      ref: "Professeur",
      required: [true, "professeur is required"],
    },
    matiere: {
      type: mongoose.Schema.ObjectId,
      ref: "Matiere",
      required: [true, "matiere is required"],
    },

    isSigned: {
      type: String,
      default: "NO",
      enum: ["YES", "NO"],
    },
    isPaid: {
      type: String,
      default: "NO",
      enum: ["YES", "NO"],
      validate: {
        validator: function (val) {
          if (this.isSigned === "YES") {
            return ["YES", "NO"].includes(val);
          } else {
            return ["NO"].includes(val);
          }
        },
        message: "Invalid groupName for division as many groups ",
      },
    },
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
/* =====================================================================MIDLWERE */
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
  return [
    professeur._id,
    professeur.nom,
    professeur.prenom,
    professeur.email,
    professeur.mobile,
    nbh,
    tauxHoreure,
    sommeUM,
    matiere.name,
    matiere_info[3],
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
