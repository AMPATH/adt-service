import config from "@amrs-integrations/core";
import { validateToken } from "../helpers/auth";
import { saveUpiIdentifier, getPatientIdentifiers } from "../helpers/patient";
import { getPatient, getFacilityMfl } from "../models/queries";
import Gender from "../ClientRegistryLookupDictionaries/gender";
import Countries from "../ClientRegistryLookupDictionaries/countries";
import Counties from "../ClientRegistryLookupDictionaries/counties";
import IdentificationTypes from "../ClientRegistryLookupDictionaries/identification-types";
import { Consumer, Message, Producer } from "redis-smq";

export default class PatientService {
  public async searchPatientByID(params: any) {
    let accessToken = await validateToken();
    let httpClient = new config.HTTPInterceptor(
      config.dhp.url || "",
      "",
      "",
      "dhp",
      accessToken
    );

    const searchIdType = params.idType;
    let idParam = "national-id";

    switch (searchIdType) {
      case "58a47054-1359-11df-a1f1-0026b9348838":
        idParam = "national-id";
        break;
      case "7924e13b-131a-4da8-8efa-e294184a1b0d":
        idParam = "birth-certificate";
        break;
      case "ced014a1-068a-4a13-b6b3-17412f754af2":
        idParam = "passport";
        break;
    }
    const url = `/search/${idParam}/${params.uno}`;
    let dhpResponse: PatientPayload.ClientObject = await httpClient.axios(url, {
      method: "get",
    });

    console.log("dhpResponse ", dhpResponse);

    return dhpResponse;
  }

  public async searchPatient(params: any) {
    let accessToken = await validateToken();
    let httpClient = new config.HTTPInterceptor(
      config.dhp.url || "",
      "",
      "",
      "dhp",
      accessToken
    );

    let identifiers = await getPatientIdentifiers(params.patientUuid);
    let idParam = "";
    let identifier = "";
    let location = "";
    identifiers.results.forEach((id: any) => {
      if (id.identifierType.uuid == "58a47054-1359-11df-a1f1-0026b9348838") {
        idParam = "national-id";
        identifier = id.identifier;
        location = id.location.uuid;
        return;
      } else if (
        id.identifierType.uuid == "7924e13b-131a-4da8-8efa-e294184a1b0d"
      ) {
        idParam = "birth-certificate";
        identifier = id.identifier;
        location = id.location.uuid;
        return;
      } else if (
        id.identifierType.uuid == "ced014a1-068a-4a13-b6b3-17412f754af2"
      ) {
        idParam = "passport";
        identifier = id.identifier;
        location = id.location.uuid;
        return;
      }
    });

    console.log("search params ", idParam, identifier, location);

    if (idParam.length != 0) {
      const url = `/search/${idParam}/${identifier}`;
      let dhpResponse: PatientPayload.ClientObject = await httpClient.axios(
        url,
        { method: "get" }
      );

      console.log("Does client exist in registry ", dhpResponse.clientExists);
      if (dhpResponse.clientExists) {
        console.log("DHP client number", dhpResponse.client.clientNumber);

        let savedUpi = await this.saveUpiNumber(
          dhpResponse.client.clientNumber,
          params.patientUuid,
          location
        );
        console.log("Saved UPI, Existing Patient", savedUpi.identifier);
        return;
      }

      /** Patient not found: Construct payload and save to Registry*/
      let payload = await this.constructPayload(params.patientUuid, location);

      httpClient.axios
        .post("", payload)
        .then(async (dhpResponse: any) => {
          let savedUpi: any = await this.saveUpiNumber(
            dhpResponse.clientNumber,
            params.patientUuid,
            location
          );
          console.log("Saved UPI, New Patient", savedUpi.identifier);
        })
        .catch((err: any) => {
          // Queue Patient
          queueClientsToRetry({
            payload: payload,
            patientUuid: params.patientUuid,
            locationUuid: location,
          });
          console.log("Error creating patient ", err);
        });

      /** TODO: Incase of error, queue patient in Redis */

      return payload;
    }
  }

  private async constructPayload(patientUuid: string, locationUuid: string) {
    let p: any = await getPatient(patientUuid);
    let mflCode = await getFacilityMfl(locationUuid);
    let identifiers: PatientPayload.PatientIdentifier[] = await getPatientIdentifiers(
      patientUuid
    );
    let allowedIDS = await this.extractAllowedIdentifiers(identifiers);

    const payload = {
      firstName: p.FirstName,
      middleName: p.MiddleName,
      lastName: p.LastName,
      dateOfBirth: p.DateOfBirth,
      maritalStatus: "",
      gender: this.mapGender(p.Gender),
      occupation: "",
      religion: "",
      educationLevel: "",
      country: this.mapCountry(p.Country),
      countyOfBirth: this.mapCounty(p.CountryOfBirth),
      originFacilityKmflCode: mflCode.mfl_code,
      isAlive: p.IsAlive,
      residence: {
        county: this.mapCounty(p.County),
        subCounty: p.SubCounty,
        ward: p.Ward,
        village: p.Village,
        landmark: p.LandMark,
        address: p.Address,
      },
      identifications: allowedIDS,
      contact: {
        primaryPhone: p.PrimaryPhone,
        secondaryPhone: p.SecondaryPhone,
        emailAddress: p.EmailAddress,
      },
      nextOfKins: [],
    };

    return payload;
  }

  private async saveUpiNumber(
    upi: string,
    patientUuid: string,
    locationUuid: string
  ) {
    const result = await saveUpiIdentifier(upi, patientUuid, locationUuid);
    console.log("result", result);
    return result;
  }

  private async extractAllowedIdentifiers(identifiers: any) {
    const allowedIdentifiers = [
      "58a47054-1359-11df-a1f1-0026b9348838",
      "ced014a1-068a-4a13-b6b3-17412f754af2",
      "7924e13b-131a-4da8-8efa-e294184a1b0d",
    ];
    let payloadIdentifiers: any = [];
    identifiers.results.forEach((e: any) => {
      if (allowedIdentifiers.includes(e.identifierType.uuid)) {
        payloadIdentifiers.push({
          IdentificationType: this.mapIDTypes(e.identifierType.uuid),
          IdentificationNumber: e.identifier,
        });
      }
    });

    return payloadIdentifiers;
  }

  private mapGender(g: string) {
    const gender: any = Gender.filter((r) => r.amrs == g);
    return gender[0].value;
  }

  private mapCountry(c: string) {
    const country: any = Countries.filter((co) => c == co.label.toLowerCase());
    return country[0].value;
  }

  private mapCounty(c: string) {
    const country: any = Counties.filter((co) => c == co.label.toLowerCase());
    return country[0].value;
  }

  private mapIDTypes(amrsId: string) {
    const idType = IdentificationTypes.filter((i) => (i.amrs = amrsId));
    return idType[0].value;
  }
}
function queueClientsToRetry(patientPayload: any) {
  const producer = new Producer();
  const message = new Message();
  message
    .setBody(JSON.stringify(patientPayload))
    .setTTL(3600000) // in millis
    .setQueue("cl_queue");
  producer.produce(message, (err) => {
    if (err) console.log(err);
    else {
      const msgId = message.getId(); // string
      console.log("Successfully produced. Message ID is ", msgId);
    }
  });
  producer.shutdown();
}
function retryQueuedClients() {
  const consumer = new Consumer();

  const messageHandler = async (
    msg: { getBody: () => any },
    cb: () => void
  ) => {
    const payload: any = msg.getBody();
    console.log("Message payload", payload);
    // TODO : Implement logic to consume errors and resend requests to DHP

    //check response for success or error. if error
    cb(); // acknowledging the message
  };

  consumer.consume("cl_queue", false, messageHandler, (err, isRunning) => {
    if (err) console.error(err);
    // the message handler will be started only if the consumer is running
    else
      console.log(
        `Message handler has been registered. Running status: ${isRunning}`
      ); // isRunning === false
  });

  consumer.run();
}
