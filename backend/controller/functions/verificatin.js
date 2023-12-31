/* ====================================================================VERIFICATION EMPLOI BEFORE ADDET OR EDIT=====================*/

function createFinishTimeFromStartTimeAndVerifiedIsBetweenT1AndT2(
  add_emploi,
  emplois_list_day,
  type
) {
  let result = ["success", "this action successfully ....", add_emploi];
  const input = add_emploi.startTime.split(":");
  let hour = parseInt(input[0]);
  let minute = parseInt(input[1]);
  const strtDate = new Date();
  strtDate.setHours(hour, minute, 0);
  let nbm = (add_emploi.nbh % 1) * 60;
  const fnshDate = new Date();
  fnshDate.setHours(hour + add_emploi.nbh, minute + nbm, 0);
  let finishTime = "";
  if (fnshDate.getMinutes() < 10) {
    finishTime = fnshDate.getHours() + ":0" + fnshDate.getMinutes();
  } else {
    finishTime = fnshDate.getHours() + ":" + fnshDate.getMinutes();
  }

  const add_emploi_strtDate_Minutes = timeToMinutes(add_emploi.startTime);
  const add_emploi_fnshDate_Minutes = timeToMinutes(finishTime);
  console.log(
    "---------------------------add emploi Time ------------------------"
  );
  console.log(`${add_emploi.startTime} to ${finishTime}`);
  console.log(
    `start-time-to-minutes : ${add_emploi_strtDate_Minutes} AND finish-time-to-minutes : ${add_emploi_fnshDate_Minutes} `
  );
  for (elem of emplois_list_day) {
    const input = elem.startTime.split(":");
    let hour = parseInt(input[0]);
    let minute = parseInt(input[1]);
    const strtDate = new Date();
    strtDate.setHours(hour, minute, 0);
    let nbm = (elem.nbh % 1) * 60;
    fnshDate.setHours(hour + elem.nbh, minute + nbm, 0);
    let finishTime = "";
    if (fnshDate.getMinutes() < 10) {
      finishTime = fnshDate.getHours() + ":0" + fnshDate.getMinutes();
    } else {
      finishTime = fnshDate.getHours() + ":" + fnshDate.getMinutes();
    }
    const strtDate_Minutes = timeToMinutes(elem.startTime);
    const fnshDate_Minutes = timeToMinutes(finishTime);
    if (
      !(
        add_emploi_strtDate_Minutes >= strtDate_Minutes &&
        add_emploi_strtDate_Minutes <= fnshDate_Minutes
      ) &&
      !(
        add_emploi_fnshDate_Minutes >= strtDate_Minutes &&
        add_emploi_fnshDate_Minutes <= fnshDate_Minutes
      )
    ) {
      console.log(
        `............................................OK..OK..................`
      );
    } else {
      result[2] = {};
      result[0] = "failed";
      result[1] = `Le temps de ce cour n'est pas valable parce que ce ${type} est occupé le méme date entre  ${elem.startTime} et ${finishTime}`;
    }
    // ${strtDate.getDate()}-${strtDate.getMonth()}-${strtDate.getFullYear()}
  }
  return result;
}
/* ------------------------------------------------------------------------------- */
function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

module.exports = createFinishTimeFromStartTimeAndVerifiedIsBetweenT1AndT2;
