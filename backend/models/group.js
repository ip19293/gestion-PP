const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const groupSchema = mongoose.Schema({
  name: {
    type: String,
    select: true,
    default: "A",
    required: [true, "Le nom du groupe est requis !"],
    enum: ["A", "B", "C", "D", "E"],
  },
  startEmploi: {
    type: Date,
    select: true,
    default: Date.now(),
  },
  finishEmploi: {
    type: Date,
    select: true,
    default: function () {
      const start = this.startEmploi.getMonth();
      const f = new Date(this.startEmploi);
      f.setMonth(start + 4);
      return f;
    },
  },
  semestre: {
    type: mongoose.Schema.ObjectId,
    ref: "Semestre",
    required: [true, "semestre est requis !"],
  },
});
groupSchema.pre("save", async function (next) {
  /*  const Semestre = require("./semestre");
  const Filliere = require("./filliere");
  const semestre = await Semestre.findById(this.semestre);
  const filliere = await Filliere.findById(semestre.filliere);
  const groups = await this.constructor.find({ semestre: this.semestre });
  let groups_name = [];
  for (x of groups) {
    groups_name.push(x.name);
  }
  let ms = `La filière ${filliere.name} ${filliere.niveau} S${semestre.numero}  est unifié on peut pas ajouter des groupes!`;
  if (this.name == "unifie") {
    ms = `La filière ${filliere.name} ${filliere.niveau} S${semestre.numero} contient des groupes on peut pas ajouter un groupe unifié!`;
  }
  if (this.isNew) {
    for (x of groups) {
      if (x.name == "unifie" || this.name == "unifie") {
        return next(new AppError(ms, 404));
      }
    }
  } else {
    if (groups.length > 1 && this.name == "unifie") {
      return next(new AppError(ms, 404));
    }
  
  } */
  next();
});
groupSchema.methods.getSNumero_FId_FName_FNiveau_NiveauAnnee =
  async function () {
    const Semestre = require("./semestre");
    const Emploi = require("./emploi");
    const Filliere = require("./filliere");
    let data = [];
    const semestre = await Semestre.findById(this.semestre);
    let semestre_info = await semestre.getNiveauAnnee();
    if (semestre) {
      const filliere = await Filliere.findById(semestre.filliere);
      if (filliere) {
        data = [
          semestre.numero,
          filliere._id,
          filliere.name,
          filliere.niveau,
          semestre_info,
        ];
      }
    }
    return data;
  };
groupSchema.post("findOneAndDelete", async function (group) {
  console.log(" group remove midleweere work ....................");
  const Emploi = require("./emploi");
  await Emploi.deleteMany({ group: group._id });
  group.name = `le groupe est supprimé avec succés avec liste d'emploi .`;
  console.log(`${group.name}`);
});

module.exports = mongoose.model("Group", groupSchema);
