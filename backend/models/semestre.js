const mongoose = require("mongoose");
const Matiere = require("./matiere");
const Filliere = require("./filliere");

const semestreSchema = mongoose.Schema(
  {
    filliere: {
      type: mongoose.Schema.ObjectId,
      ref: "Filliere",
      select: true,
    },
    numero: {
      type: Number,
      select: true,
      enum: [1, 2, 3, 4, 5, 6],
      validate: {
        // this only works on CREATE and SAVE!!!
        validator: async function (el) {
          const filliere = await Filliere.findById(this.filliere);
          let filliere_info = await filliere.getInformation();
          return el <= 2 * filliere_info[4];
        },
        message: `Seulement 4 semestres en master !`,
      },
    },
    start: {
      type: Date,
      select: true,
      default: Date.now(),
    },
    finish: {
      type: Date,
      select: true,
      default: function () {
        const start = this.start.getMonth();
        const f = new Date(this.start);
        f.setMonth(start + 4);
        return f;
      },
    },
    elements: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Matiere",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

semestreSchema.pre("save", async function (next) {
  const unqRef = [...new Set(this.elements.map(String))];
  if (this.elements.length !== unqRef.length) {
    const error = new Error("Réference d'objet en double dans l'élément !");
    return next(error);
  }
  try {
    const existe_matiere = await Promise.all(
      this.elements.map(async (el) => {
        const refDoc = await Matiere.findById(el);
        if (!refDoc) {
          throw new Error(
            `Réference  document introuvable pour identifiant: ${el} !`
          );
        }
        return refDoc;
      })
    );
    next();
  } catch (error) {
    next(error);
  }
  /* --------------------------------------------------------REMOVE SEMESTRES IN FINDONEANDDELETED FILLIERE */
  semestreSchema.post("findOneAndDelete", async function (semestre, message) {
    console.log(" semestre remove midleweere work ....................");
    const Group = require("./group");
    const Emploi = require("./emploi");
    const Filliere = require("./filliere");
    const groups = await Group.find({ semestre: semestre._id });
    const filliere = await Filliere.findById(this.filliere);
    let emplois = [];
    for (elem of groups) {
      let emploi = await Emploi.deleteMany({ group: elem._id });
      if (emploi) {
        emplois.push(emploi);
      }
    }
    await Group.deleteMany({ semestre: semestre._id });
    console.log(
      `Le semestre  ${semestre.numero} de ${filliere.niveau}  ${filliere.name} avec  ${groups} et  ${emplois.length} cours d'emploi du temps  est supprimé !`
    );
  });
});
semestreSchema.post("save", async function (semestre) {
  /*  semestre.numero = 2;
  await semestre.save(); */
  console.log(`${semestre}`);
});
/* ------------------------------------------------------------------------------------------ */

module.exports = mongoose.model("Semestre", semestreSchema);
