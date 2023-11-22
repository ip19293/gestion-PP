const mongoose = require("mongoose");
const Categorie = require("./categorie");
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

          return el <= 2 * filliere.periode;
        },
        message: `We have only 4 semestres in master !`,
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
    const error = new Error("Duplicate ObjectId reference in elements");
    return next(error);
  }
  try {
    const existe_matiere = await Promise.all(
      this.elements.map(async (el) => {
        const refDoc = await Matiere.findById(el);
        if (!refDoc) {
          throw new Error(`Referenced document not found for objectId: ${el}`);
        }
        return refDoc;
      })
    );
    next();
  } catch (error) {
    next(error);
  }
  /* --------------------------------------------------------REMOVE SEMESTRES IN FINDONEANDDELETED FILLIERE */
  semestreSchema.post("findOneAndDelete", async function (semestre) {
    console.log(" semestre remove midleweere work ....................");
    const Group = require("./group");
    const Emploi = require("./emploi");
    const groups = await Group.find({ semestre: semestre._id });
    let nb = 0;
    let mm = [];
    for (elem of groups) {
      nb = nb + 1;
      mm.push(elem.groupName);
      await Emploi.deleteMany({ group: elem._id });
    }
    await Group.deleteMany({ semestre: semestre._id });
    console.log(
      `Successfully deleted semestre : ${semestre.numero}   with his groups ${nb} : ${mm} ...`
    );
  });
  
  /* ----------------------------------------------------- semestre numero ----------------------- */

  /* this.elements.forEach((e) => {
    let data = id_EMs_TO_code_EM_name_EM(this.numero, e.id_EM);
    console.log("----------------------------------------------------");
    console.log(`CODE:${data[0]}`);
    console.log(`NAME:${data[1]}`);
    e.code_EM = data[0];
    e.name_EM = data[1];
       const matiere = await Matiere.findById(e.id_EM).populate([
      { path: "categorie" },
    ]);
    e.name_EM = matiere.name;
    await names.push(matiere.name);
    const categorie = await Categorie.findById(matiere.categorie._id);
    const nb_matiere_categorie = matiere.numero;
    let categorie_code = "";
    let categorie_elements = categorie.name.split(" ");
    if (!categorie_elements[1]) {
      categorie_code = categorie_elements[0].substr(0, 3).toLocaleUpperCase();
    } else if (categorie_elements[1] && !categorie_elements[2]) {
      categorie_code =
        categorie_elements[0].substr(0, 2).toLocaleUpperCase() +
        categorie_elements[1].substr(0, 1).toLocaleUpperCase();
    } else {
      categorie_elements.forEach((element) => {
        categorie_code =
          categorie_code + element.substr(0, 1).toLocaleUpperCase();
      });
      console.log(categorie_code);
    }
    e.code_EM = categorie_code + this.numero + "1" + nb_matiere_categorie;
    // await console.log(e.code_EM);
    await codes.push(e.code_EM);
  });

  this.elements.forEach((e) => {
    codes.forEach((el) => {
      e.code_EM = el;
    });
    names.forEach((el) => {
      e.name_EM = el;
    });
  }); */
});
semestreSchema.post("save", async function (semestre) {
  /*  semestre.numero = 2;
  await semestre.save(); */
  console.log(`${semestre}`);
});
/* ------------------------------------------------------------------------------------------ */

module.exports = mongoose.model("Semestre", semestreSchema);
