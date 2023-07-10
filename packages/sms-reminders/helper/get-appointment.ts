import { Appointment } from '../models/appointment';
import { Patient } from '../models/patient';

export const getAppointment = async (param: Patient, rows: any[]) =>{

    if (rows.length == 0) return null;
    const payload: Appointment = {
        MESSAGE_HEADER: {
           SENDING_APPLICATION: "KENYAEMR",
           SENDING_FACILITY: rows[0].RECEIVING_FACILITY,
           RECEIVING_APPLICATION: "IL",
           RECEIVING_FACILITY: rows[0].RECEIVING_FACILITY,
           MESSAGE_DATETIME: (rows[0].MESSAGE_DATETIME)?.toString().replace(/[-:\s]/g,''),
           SECURITY: "",
           MESSAGE_TYPE: "SIU^S12",
           PROCESSING_ID: "P"
        },
        PATIENT_IDENTIFICATION: {
           EXTERNAL_PATIENT_ID: {
            ID: rows[0].PI_EPID_ID?.toString().replace(/-/g,'') || '',
            IDENTIFIER_TYPE: rows[0].PI_EPID_TYPE?.replace(/[-\s]/g,'_').toUpperCase() || "",
            ASSIGNING_AUTHORITY: rows[0].PI_EPID_ASSIGN_AUTH || "MPI"
           },
           INTERNAL_PATIENT_ID: [
            {
                ID: rows[0].PI_IPID_1_ID?.replace(/-/g,'') || '',
                IDENTIFIER_TYPE: rows[0].PI_IPID_1_TYPE?.replace(/[-\s]/g,'_').toUpperCase() || "",
                ASSIGNING_AUTHORITY: rows[0].PI_IPID_1_ASSIGN_AUTH ||"CCC"
            },
            {
                ID: rows[0].PI_IPID_2_ID?.replace(/-/g,'')  || '',
                IDENTIFIER_TYPE: rows[0].PI_IPID_2_TYPE?.replace(/[-\s]/g,'').toUpperCase() || "",
                ASSIGNING_AUTHORITY: rows[0].PI_IPID_2_ASSIGN_AUTH || "MOH"
            }
           ],
           PATIENT_NAME: {
               FIRST_NAME: rows[0].FIRST_NAME,
               MIDDLE_NAME: rows[0].MIDDLE_NAME,
               LAST_NAME: rows[0].LAST_NAME
           },
           MOTHER_NAME: {
                FIRST_NAME: rows[0].MOTHER_NAME || "",
                MIDDLE_NAME: "",
                LAST_NAME: ""
           },
           DATE_OF_BIRTH: (rows[0].DATE_OF_BIRTH)?.replace(/-/g,''),
        SEX: rows[0].SEX || "",
        PATIENT_ADDRESS: {
            PHYSICAL_ADDRESS: {
                VILLAGE: rows[0].VILLAGE || "",
                WARD: "",
                SUB_COUNTY: rows[0].SUB_COUNTY || "",
                COUNTY: rows[0].COUNTY || "",
                GPS_LOCATION: rows[0].GPS_LOCATION || "",
                NEAREST_LANDMARK: rows[0].LAND_MARK || ""
            },
            POSTAL_ADDRESS: rows[0].POSTAL_ADDRESS || ""
        },
            PHONE_NUMBER: param.phone_number || rows[0].PHONE_NUMBER || '',
            MARITAL_STATUS: rows[0].MARITAL_STATUS || "",
            DEATH_DATE: rows[0].DEATH_DATE?.replace(/[-:\s]/g,'') || "",
            DEATH_INDICATOR: rows[0].DEATH_INDICATOR || "",
            DATE_OF_BIRTH_PRECISION: rows[0].DATE_OF_BIRTH_PRECISION
        },
        APPOINTMENT_INFORMATION: [
            {
              APPOINTMENT_REASON: "FOLLOWUP",
              ACTION_CODE: "A",
              APPOINTMENT_PLACING_ENTITY: "KENYAEMR",
              APPOINTMENT_STATUS: "PENDING",
              APPOINTMENT_TYPE: "CLINICAL",
              APPOINTMENT_NOTE: "N/A",
              APPOINTMENT_DATE: (rows[0].APPOINTMENT_DATE)?.toString().replace(/[-:\s]/g,'')|| "",
              VISIT_DATE: (rows[0].VISIT_DATE)?.toString().replace(/[-:\s]/g,'')|| "",
              PLACER_APPOINTMENT_NUMBER: {
                ENTITY: "KENYAEMR",
                NUMBER: "12345"
              },
              CONSENT_FOR_REMINDER: "Y"
            }
        ]
    };

    return payload;
}