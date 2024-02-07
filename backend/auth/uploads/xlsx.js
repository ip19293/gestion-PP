const XLSX = require("xlsx");
const file = "C:/Users/HP/Desktop/gestion-PP/backend/auth/uploads/source.xlsx";
const file1 =
  "C:/Users/HP/Desktop/gestion-PP/backend/auth/uploads/DSI_S3_SupNum.xlsx";
const workbook = XLSX.readFile(file, { cellDates: true });
const workbook1 = XLSX.readFile(file1, { cellDates: true });
const catchAsync = require("../../utils/catchAsync");
exports.xlsx_to_json = catchAsync(async (req, res, next) => {
  const emploiName = workbook.Sheets["Feuil1"];
  const emploiName1 = workbook1.Sheets["Emploi"];
  const emploiData = XLSX.utils.sheet_to_json(emploiName);

  const sheetName = workbook1.SheetNames[0];
  const sheet = workbook1.Sheets[sheetName];

  // Create an object to store summed column values
  const columnSums = {};

  // Iterate over each cell in the sheet
  for (const cellAddress in sheet) {
    if (cellAddress[0] === "!" || isNaN(cellAddress[1])) {
      // Skip non-cell data
      continue;
    }

    const cellValue = sheet[cellAddress].v;
    if (sheet[XLSX.utils.decode_cell(cellAddress).c]) {
      const columnName = sheet[XLSX.utils.decode_cell(cellAddress).c].v;
    } else {
      continue;
    }

    // Check if the column is labeled "facteur commun" and the cell value is a number
    if (columnName === "A" && !isNaN(cellValue)) {
      // Sum the values in the "A" column
      columnSums["A"] = (columnSums["A"] || 0) + cellValue;
    }
  }

  // Convert the sheet to JSON
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Update the JSON data with summed "facteur commun" column values
  jsonData.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (sheet[XLSX.utils.decode_cell({ c: columnIndex }).c]) {
        const columnName =
          sheet[XLSX.utils.decode_cell({ c: columnIndex }).c].v;
        if (columnName === "A" && !isNaN(cell)) {
          // Replace the original value with the summed value
          jsonData[rowIndex][columnIndex] = columnSums["A"];
        }
      }
    });
  });

  const finalJsonData = jsonData.filter((row) => row.length > 0);
  console.log(jsonData[4][0]);

  // Remove null and empty values from the JSON data
  const filteredJsonData = finalJsonData.map((row) =>
    row.filter((cell) => cell !== null && cell !== undefined && cell !== "")
  );
  let filiere = "";
  let emplois = [];
  let daysOfWeek = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];

  for (const [index, x] of finalJsonData.entries()) {
    console.log(x.length);
    if (x.length == 1) filiere = x[0].split("-")[0];

    if (x.length == 21 && x[0] !== null && x[0] !== undefined && x[0] !== "") {
      if (x[1] !== null && x[1] !== undefined && x[1] !== "") {
        let matiere_index = index + 1;
        let professeur_index = index + 2;
        let dt = {
          jour: x[0],
          code: x[1],
          type: x[2],
          startTime: "8:00",
          nbh: 1.5,
          professeur: finalJsonData[professeur_index][1],
          matiere: finalJsonData[matiere_index][1],
        };
        emplois.push(dt);
        console.log(dt);
      }
      if (x[5] !== null && x[5] !== undefined && x[5] !== "") {
        let professeur_index = finalJsonData[index + 2].length - 1;
        let matiere_index = finalJsonData[index + 1].length - 1;
        let dt = {
          jour: x[0],
          code: x[5],
          type: x[6],
          startTime: "9:45",
          nbh: 1.5,
          professeur: finalJsonData[index + 2][professeur_index],
          matiere: finalJsonData[index + 1][matiere_index],
        };
        emplois.push(dt);
        console.log(dt);
      }
      if (x[9] !== null && x[9] !== undefined && x[9] !== "") {
        let professeur_index = finalJsonData[index + 2].length - 1;
        let matiere_index = finalJsonData[index + 1].length - 1;
        let dt = {
          jour: x[0],
          code: x[9],
          type: x[10],
          startTime: "11:30",
          nbh: 1.5,
          professeur: finalJsonData[index + 2][professeur_index],
          matiere: finalJsonData[index + 1][matiere_index],
        };
        emplois.push(dt);
        console.log(dt);
      }
      if (x[13] !== null && x[13] !== undefined && x[13] !== "") {
        let professeur_index = finalJsonData[index + 2].length - 1;
        let matiere_index = finalJsonData[index + 1].length - 1;
        let dt = {
          jour: x[0],
          code: x[13],
          type: x[14],
          startTime: "15:00",
          nbh: 1.5,
          professeur: finalJsonData[index + 2][professeur_index],
          matiere: finalJsonData[index + 1][matiere_index],
        };

        console.log(dt);
      }
      if (x[17] !== null && x[17] !== undefined && x[17] !== "") {
        let professeur_index = finalJsonData[index + 2].length - 1;
        let matiere_index = finalJsonData[index + 1].length - 1;
        let dt = {
          jour: x[0],
          code: x[17],
          type: x[18],
          startTime: "17:00",
          nbh: 1.5,
          professeur: finalJsonData[index + 2][professeur_index],
          matiere: finalJsonData[index + 1][matiere_index],
        };
        emplois.push(dt);
        console.log(dt);
      }
    }
  }
  console.log(filiere);

  res.status(200).json({
    status: "succés",
    emplois,
    finalJsonData,
    filteredJsonData,
  });
});
