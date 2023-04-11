import path from "path";
import fs from "fs";
import csv from "csv-parser";
import config from "@amrs-integrations/core";
import Validators from "../helpers/validators";
import GetPatient from "../helpers/dbConnect";
import Helpers from "../helpers/helperFunctions";
import moment from "moment";

export default class ExtractCSVAndPostToETL {
  public async readCSVAndPost(fileName: string) {
    try {
      const filePath = path.join(__dirname, `../uploads${fileName}`);
      const fileContents = fs.readFileSync(filePath, "utf-8");

      // Determine if the file is a CD4 or viral load file
      const isViralLoadFile = fileContents.includes("Lab Viral Load");
      const isCD4File = fileContents.includes("CD4 abs");
      const getPatient = new GetPatient();
      const helper = new Helpers();

      const rows: any = await new Promise(async (resolve, reject) => {
        let synced = 0;
        if (isViralLoadFile) {
          // File is a viral load file, extract columns accordingly
          const results: any = [];
          fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", async (row) => {
              let {
                "Lab Viral Load": value,
                "Collection Date": collectionDate,
                "Patient CCC No": patientCCCNo,
                "Order No": order,
              } = row;
              // Check if any of the extracted columns are empty
              if (!value || !collectionDate || !patientCCCNo || !order) {
                throw new Error("One or more extracted columns are empty");
              }
              // Check if the patient CCC number is valid
              const validator = new Validators();
              const isValidCCC = validator.checkIdentifierIsCCC(patientCCCNo);
              let patientUUID: any = "";

              // get the patient uuid from db
              const patientOtherIdentifier = await getPatient.getPatientUUIDUsingIdentifier(
                patientCCCNo,
                isValidCCC
              );
              if (patientOtherIdentifier.length > 0) {
                patientUUID = patientOtherIdentifier[0].uuid;
              } else {
                // log errors
                let logMessage =
                  "Patient: " + patientCCCNo + " PatientUUID not found.";
                helper.logError(logMessage, "syncErroLog.log");
                reject("Patient Not Found" + patientCCCNo);
              }

              // check if data is already synced
              const isDataSynced = await getPatient.checkPatientVLSync(
                row,
                patientUUID
              );
              if (isDataSynced[0].count > 0) {
                synced++;
                // log errors
                let logMessage =
                  "Patient: " + patientCCCNo + " Data already synced.";
                helper.logError(logMessage, "syncErroLog.log");
                reject("Patient Results Already Synced" + patientCCCNo);
              }

              let httpClient = new config.HTTPInterceptor(
                config.dhp.url || "",
                "",
                "",
                "dhp",
                ""
              );

              httpClient.axios
                .post("", results)
                .then(async (openHIMResp: any) => {
                  console.log("Vl saved successfully", openHIMResp);
                })
                .catch((err: any) => {
                  console.log("Error", err);
                });
              let collection_date = moment
                .utc(collectionDate, "DD/MM/YYYY")
                .add(3, "hours")
                .format();
              let obs: EIDPayloads.Observation = {
                person: patientUUID,
                concept: "a8982474-1350-11df-a1f1-0026b9348838",
                obsDatetime: collection_date,
                value: value,
                order: order,
              };
              results.push(obs);
            })
            .on("end", () => {
              if (results.length === 0) {
                let logMessage = "No data extracted from the CSV file";
                helper.logError(logMessage, "syncErroLog.log");
                reject("No data extracted from the CSV file");
              } else {
                resolve(results);
              }
            });
        } else if (isCD4File) {
          // File is a CD4 file, extract columns accordingly
          const results: any = [];
          fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", async (row) => {
              let {
                "CD4 abs": value,
                "Date Collected/Drawn": collectionDate,
                "Ampath #": patientCCCNo,
                "Provider ID": order,
              } = row;
              // Check if any of the extracted columns are empty
              if (!value || !collectionDate || !patientCCCNo || !order) {
                throw new Error("One or more extracted columns are empty");
              }
              // Check if the patient CCC number is valid
              const validator = new Validators();
              const isValidCCC = validator.checkIdentifierIsCCC(patientCCCNo);
              let patientUUID: any = "";
                // get the patient uuid from db
                const patientOtherIdentifier = await getPatient.getPatientUUIDUsingIdentifier(
                  patientCCCNo,
                  isValidCCC
                );
                if (patientOtherIdentifier.length > 0) {
                  patientUUID = patientOtherIdentifier[0].uuid;
                }else {
                  // log errors
                  let logMessage =
                    "Patient: " + patientCCCNo + " PatientUUID not found.";
                  helper.logError(logMessage, "syncErroLog.log");
                  reject("Patient Not Found" + patientCCCNo);
                }

              // check if data is already synced
              const isDataSynced = await getPatient.checkPatientCD4Sync(
                row,
                patientCCCNo
              );
              if (isDataSynced[0].count > 0) {
                synced++
                  // log errors
                  let logMessage =
                  "Patient: " + patientCCCNo + " Data already synced.";
                helper.logError(logMessage, "syncErroLog.log");
                reject("Patient Results Already Synced" + patientCCCNo);
              }
              let collection_date = moment
                .utc(collectionDate, "DD/MM/YYYY")
                .add(3, "hours")
                .format();
              let obs: EIDPayloads.Observation = {
                person: patientUUID,
                concept: "457c741d-8f71-4829-b59d-594e0a618892",
                obsDatetime: collection_date,
                value: value,
                order: order,
              };
              results.push(obs);
            })
            .on("end", () => {
              if (results.length === 0) {
                throw new Error("No data extracted from the CSV file");
              }
              resolve(results);
            });
        } else {
          // File is neither a CD4 nor a viral load file
          return reject("File is neither a CD4 nor a viral load file");
        }
      });

      return {
        message: "CSV file successfully processed",
        syncedRows: rows,
      };
    } catch (error) {
      console.log("Failed to process CSV file");
      //   throw new Error("Failed to process CSV file");
      return {
        message: "Failed to process CSV file",
      };
    }
  }
}
