const mongoose = require("mongoose");

const categorieSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "la catégorie est requis !"],
      lowercase: true,
      unique: true,
      trim: true,
    },
    prix: {
      type: Number,
      required: [true, "le prix est requis !"],
      default: 900,
      min: [500, "Le prix doi etre supperiére a 500 !"],
      max: [900, "Le prix doi etre inferiére a 900 !"],
    },
    code: {
      type: String,
      select: true,
      unique: true,
    },
  },
  { timestamps: true }
);
//SAVE MIDLWERED ----------------------------------------------------------------------------------
categorieSchema.pre("save", async function (next) {
  //gernerate code from name
  let categorie_code = "";
  let name_part = this.name.split(" ");
  if (!name_part[1]) {
    categorie_code = name_part[0].substr(0, 3).toLocaleUpperCase();
  } else if (name_part[1] && !name_part[2]) {
    categorie_code =
      name_part[0].substr(0, 2).toLocaleUpperCase() +
      name_part[1].substr(0, 1).toLocaleUpperCase();
  } else {
    name_part.forEach((element) => {
      categorie_code =
        categorie_code + element.substr(0, 1).toLocaleUpperCase();
    });
  }
  try {
    this.code = categorie_code;
  } catch (error) {
    console.log(error.message);
  }
  next();
});
//GET NOMBRE OF ELEMENTS IN CATEGORIE METHOD
categorieSchema.methods.getNombreElements = async function () {
  const Element = require("./element");
  let nombreElements = await Element.find({ categorie: this._id }).count();
  return nombreElements;
};

// FIND ONE AND DELETE MIDLEWEERE ------------------------------------------------
categorieSchema.post("findOneAndDelete", async function (categorie, message) {
  console.log(" categorie remove midleweere work ....................");
  const Element = require("./element");
  const Emploi = require("./emploi");
  const elements = await Element.find({ categorie: categorie._id });
  let elements_ids = elements.map((doc) => doc._id.toString()).flat();
  await Element.deleteMany({ categorie: categorie._id });
  await Emploi.deleteMany({ element: { $in: elements_ids } });

  categorie.name = `Le categorie est supprimée avec succéss `;
});

module.exports = mongoose.model("Categorie", categorieSchema);
