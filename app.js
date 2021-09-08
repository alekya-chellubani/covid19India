const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server Running at http://localhost:3003/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertTo = (item) => {
  return {
    stateId: item.state_id,
    stateName: item.state_name,
    population: item.population,
  };
};

const changeTo = (district) => {
  return {
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  };
};
// Get Books API
app.get("/states/", async (request, response) => {
  const getStateQuery = `
    SELECT
      *
    FROM
      state
    ORDER BY
      state_id;`;
  const stateArray = await db.all(getStateQuery);
  response.send(stateArray.map((eachItem) => convertTo(eachItem)));
});
//GET specified state API
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
      *
    FROM
      state
    WHERE
      state_id=${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertTo(state));
});
//POST API districts
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO district(district_name, state_id, cases, cured, active, deaths) VALUES ('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}');`;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});
//GET specific district API
app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
      *
    FROM
      District
    WHERE
      district_id=${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(changeTo(district));
});
// DELETE district API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDeleteQuery = `
    DELETE FROM district WHERE district_id=${districtId};`;
  await db.run(districtDeleteQuery);
  response.send("District Removed");
});
// PUT district API
app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const districtPutQuery = `
    UPDATE district SET district_name='${districtName}',
     state_id='${stateId}',
     cases='${cases}',
     cured='${cured}',
     active='${active}',
     deaths='${deaths}'
    WHERE district_id=${districtId};`;
  await db.run(districtPutQuery);
  response.send("District Details Updated");
});

const toList = (stats) => {
  return {
    totalCases: stats.t_cases,
    totalCured: stats.t_cured,
    totalActive: stats.t_active,
    totalDeaths: stats.t_deaths,
  };
};
//Stats API
app.get("/states/:stateId/stats", async (request, response) => {
  const { stateId } = request.params;
  const getStatQuery = `
    SELECT SUM(cases) as t_cases,
    SUM(cured)  as t_cured,
    SUM(active) as t_active,
    SUM(deaths) as t_deaths
    FROM district 
    WHERE state_id=${stateId};`;
  const statArray = await db.get(getStatQuery);
  console.log(statArray);
  response.send(toList(statArray));
});
//Deatails GET API
app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const getDetailsQuery = `
    SELECT state_name FROM district JOIN state WHERE district_id=${districtId}; `;
  const detailsArray = await db.get(getDetailsQuery);
  response.send({ stateName: detailsArray.state_name });
});
module.exports = app;
