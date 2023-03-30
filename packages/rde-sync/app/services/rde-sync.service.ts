import { AMRS_POOL, ETL_POOL } from "../db";
import { ResponseToolkit } from "@hapi/hapi";
import { RowDataPacket } from "mysql2";
import { RDEQueuePayload } from "../models/RequestParams";
import { QueueStatus } from "../models/Model";

class RdeSyncService {
  async getPatientIds(identifiers: string[]) {
    let whereQuery = "";
    identifiers.forEach((identifier) => {
      whereQuery += `'${identifier}',`;
    });

    const query = `SELECT DISTINCT patient_id FROM patient_identifier WHERE identifier IN (${whereQuery.slice(
      0,
      -1
    )})`;

    const connection = await AMRS_POOL.getConnection();
    const result = await connection.execute(query);
    connection.release();

    return result;
  }

  async queueRDEPatients(request: RDEQueuePayload, h: ResponseToolkit) {
    const { identifiers, userId, reportingMonth } = request;

    const [rows] = await this.getPatientIds(identifiers);

    const handleRow = async (row: RowDataPacket) => {
      const patientId = row.patient_id;

      const moment = require("moment-timezone");
      let now = moment().tz("Africa/Nairobi");
      let formattedDateTime = now.format("YYYY-MM-DD HH:mm:ss");

      let query = `INSERT INTO rde_sync_queue (user_id, patient_id, date_created, reporting_month, status) VALUES (${userId}, ${patientId}, '${formattedDateTime}', '${reportingMonth}', 'QUEUED')`;

      const connection = await ETL_POOL.getConnection();
      const [rows] = await connection.execute(query);
      connection.release();
      h.response(rows).created;
    };

    if (Array.isArray(rows)) {
      rows.forEach((row: any) => {
        return handleRow(row as RowDataPacket);
      });
    }
  }

  async updatePatientStatus(
    patientIds: number[],
    status: QueueStatus) {
    const connection = await ETL_POOL.getConnection();
    const queueStatus: string = QueueStatus[status];
    try {
      for (const id of patientIds) {
        const query =
          "UPDATE rde_sync_queue SET status = ? WHERE patient_id = ?";
        const [updates] = await connection.execute(query, [queueStatus, id]);
        console.info("Patient queue status updated", updates);
      }
      //return h.response({ message: "Patient status updated" }).code(200);
    } catch (error) {
      console.error(error);
      // return h
      //   .response({ message: "Failed to update patient status" })
      //   .code(500);
    } finally {
      connection.release();
    }
  }
  // async updatePatientStatus(
  //   patientIds: string[],
  //   status: string,
  //   h: ResponseToolkit
  // ) {
  //   patientIds.forEach(async (id) => {
  //     let query = `UPDATE rde_sync_queue SET status = '${status}' WHERE patient_id = ${id}`;
  //     const connection = await ETL_POOL.getConnection();
  //     const [updates] = await connection.execute(query);
  //     connection.release();
  //     return h.response(updates).code(200);
  //   });
  // }

  async deletePatientRecord(id: string, h: ResponseToolkit) {
    const identifiers = [id];
    const [patientId] = await this.getPatientIds(identifiers);
    if (Array.isArray(patientId)) {
      const id = patientId[0] as { patient_id: number };
      const query = `DELETE FROM rde_sync_queue WHERE patient_id = ${id.patient_id}`;
      const connection = await ETL_POOL.getConnection();
      const [deleted] = await connection.execute(query);
      connection.release();
      return h.response(deleted).code(204);
    }
  }
}

export default RdeSyncService;
