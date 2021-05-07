import mysql, { Connection } from "mysql";

import ConnectionManager from "../loaders/mysql";
const CM = ConnectionManager.getInstance();
const table = "etl.adt_drug_orders";
export async function savePrescription(
  prescription: IADTDispense.ADTDispense,
  connection: Connection
) {
  for (let i = 0; i < prescription.drug_details.length; i++) {
    const sql = mysql.format(
      `INSERT INTO ${table} Values (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        "",
        prescription.mflcode,
        prescription.order_details.transaction_datetime,
        prescription.order_details.order_number,
        prescription.drug_details[i].prescription_number,
        prescription.drug_details[i].drug_code,
        prescription.drug_details[i].strength,
        prescription.drug_details[i].dosage,
        prescription.drug_details[i].units,
        prescription.drug_details[i].frequency,
        prescription.drug_details[i].duration,
        prescription.drug_details[i].prescription_notes,
      ]
    );
    let result: Patient.Patient = await CM.query(sql, connection);
    console.log(result);
  }
  CM.releaseConnections(connection);
}
