const Cours = require("../../models/cours");
const Professeur = require("../../models/professeur");
const Matiere = require("../../models/matiere");

exports.types_TO_th_nbh_nbm_thsm = (types) => {
  let th = 0;
  let nbh = 0;
  let nbm = 0;
  let thsm = 0;
  types.forEach((e) => {
    if (e.name == "CM") {
      th = th + e.nbh;
    }
    if (e.name == "TD" || e.name == "TP") {
      th = th + (e.nbh * 2) / 3;
    }
    thsm = th + thsm;
    nbh = nbh + e.nbh;
  });
  nbm = (nbh % 1) * 60;

  return [th, nbh, nbm, thsm];
};

/* -----------------------------cours response function------------------------------- */

/* -----------------------------get semestre and the list of elements------------------------------- */

async function getSemestreElements(semestre) {
  const data = [];
  for (const e of semestre.elements) {
    try {
      const matiere = await Matiere.findById(e);
      code =
        (await matiere.getCode()) +
        (await matiere.getNumero()) +
        "1" +
        (await semestre.numero);
      let s = new SemestreResponse(
        semestre._id,
        semestre.numero,
        semestre.filliere.name,
        semestre.start,
        semestre.finish,
        [e, code, matiere.name]
      );
      data.push(s);
    } catch (error) {
      console.log("Error:", error);
    }
  }
  return data;
}

module.exports = getSemestreElements;
/*   const emploiData1 = XLSX.utils.sheet_to_json(emploiName1, {
    header: 1,
    blankrows: false,
    defval: "",
  
  });
  let cellName = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
  ];
  let dt = [];
  let data = [];
  let filiere = emploiName1["A1"] ? emploiName1["A1"].v.split("-")[0] : "";
  let semestre = emploiName1["D2"] ? emploiName1["D2"].v[1] : 0;
  let semaine = emploiName1["L2"] ? emploiName1["L2"].v : 1;
  let fromDate = emploiName1["O2"] ? emploiName1["O2"].v : new Date(Date.now());
  let emploi_head = [];
  console.log(fromDate);
  console.log(Object.keys(emploiData1));

    let dataKeys = Object.keys(emploiData1);
  for (x of dataKeys) {
    dayofWeek.push(emploiData1[x].__EMPTY_19);
     console.log(emploiData[x].__EMPTY + "------" + emploiData[x].__EMPTY_1);
  } 
  get json data values not "" and string from ligne 4
  let test_salem = [
    {
      value: "08h00 à 09h30",
      startTime: "8:00",
      column: "B",
      dayLine: [{ value: [5, 6, 7], dayNumero: 1 }],
    },
    {
      value: "09h45 à 11h15",
      startTime: "9:45",
      column: "F",
      dayLine: [{ value: [5, 6, 7], dayNumero: 1 }],
    },
    {
      value: "11h30 à 13h00",
      startTime: "11:30",
      column: "J",
      dayLine: [{ value: [5, 6, 7], dayNumero: 1 }],
    },
    {
      value: "15h00 à 16h30",
      startTime: "15:00",
      column: "N",
      dayLine: [{ value: [5, 6, 7], dayNumero: 1 }],
    },
    {
      value: "17h00 à 18h30",
      startTime: "17:00",
      column: "R",
      dayLine: [{ value: [5, 6, 7], dayNumero: 1 }],
    },
  ];
  for (let x = 4; x < 30; x++) {
    for (cell of cellName) {
      let cellCompletName = cell + x;
      if (emploiName1[cellCompletName]) {
        let value = emploiName1[cellCompletName].v;
        if (value != "" && typeof value === "string") {
          let prof = value.split("/");
          console.log(typeof value);
          let dt = {
            value: value,
            ligne: x,
            column: cell,
            startTime: "",
            professeur: "",
            dayNumero: -1,
          };
          if (prof.length == 2) {
            dt.professeur = value;
          }
          if (dt.column === "B" && [5, 6, 7].includes(dt.ligne)) {
            dt.startTime = "8:00";
            dt.dayNumero = 1;
          }

          data.push(dt);
        }
      }
    }
  }
  let data2 = [];
  for (dt of data) {
    for (y of test_salem) {
      if (dt.column === y.column) {
        for (z of y.dayLine) {
          if (z.value.includes(dt.ligne)) {
            dt = {
              dayNumero: y.dayLine.dayNumero,
              startTime: y.startTime,
              nbh: 1.5,
              value: dt.value,
                 ligne: x,
              column: cell,
            };
          }
        }
        data2.push(dt);
      }
    }
  }
  let daysOfWeek = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  let partOfTemp = [
    { value: "08h00 à 09h30", startTime: "8:00" },
    { value: "09h45 à 11h15", startTime: "9:45" },
    { value: "11h30 à 13h00", startTime: "11:30" },
    { value: "15h00 à 16h30", startTime: "15:00" },
    { value: "17h00 à 18h30", startTime: "17:00" },
  ];
  let days = [];
  for (dy of daysOfWeek) {
    let filDy = data.find((obj) => obj.value === dy);
    if (filDy) {
      let dt = {
        name: dy,
        ligne: filDy.ligne,
        column: filDy.column,
        dayNumero: daysOfWeek.indexOf(dy),
        lignes: [filDy.ligne + 1, filDy.ligne + 2],
      };
      days.push(dt);
    }
  }
  let temps = [];
  for (tm of partOfTemp) {
    let filDy = data.find((obj) => obj.value === tm.value);
    if (filDy) {
      let dt = {
        startTime: tm.startTime,
        nbh: 1.5,
        name: tm.value,
        ligne: filDy.ligne,
        column: filDy.column,
        lignes: [filDy.ligne + 1, filDy.ligne + 2],
      };
      temps.push(dt);
    }
  }

  let filDy = data.filter((obj) => obj.column === "B");

    for (el of days) {
    let ligne = el.ligne;
    let jour = el.dayNumero;
    // let column = el.column;
    for (t of temps) {
      let ligne_T = el.ligne;
      let column_T = el.column;
      for (e of el.lignes);
    }
  }
    let days = [
    { name: "Lundi", ligne: 5, id: 1 },
    { name: "Mardi", ligne: 9, id: 2 },
    { name: "Mercredi", ligne: 13, id: 3 },
    { name: "Jeudi", ligne: 19, id: 4 },
    { name: "Vendredu", ligne: 21, id: 5 },
    { name: "Samdi", ligne: 25, id: 6 },
  ];
   let temps = [{ name: "B", columns: ["C", "D"], id: "8:00" }];
    for (elem of data) {
    console.log(elem);
    if (elem.column === "B") {
      let dt = {
        dayNumero: 1,
        date: emploiName1[elem.ligne],
      };
    }
    Lundi.push(dt);
  }
   for (cell of cellName) {
    console.log(cell);
    let x = cell + 1;
    if (emploiName1[x]) {
      console.log(emploiName1[x].v);
    }
  }
  console.log(emploiName1["B2"].v);
  const sal = emploiData1.filter((row) => row.some((cell) => cell !== "")); */
