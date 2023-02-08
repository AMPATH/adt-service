import { client } from "./auth";

export async function getPatientIdentifiers(patientUUID: string) {
  let httpClient =await client("amrs")
  let identifiers = await httpClient.axios(
    "/ws/rest/v1/patient/" + patientUUID + "/identifier",
    {
      method: "get",
    }
  );

  return identifiers;
}
export async function saveCountryAttribute(patientUuid:string, countryCode:string) {
  const payload = {
    attributeType: "8d871afc-c2cc-11de-8d13-0010c6dffd0f",
    value: countryCode,
  };

  let httpClient = await client("amrs")
  return await httpClient.axios.post(
    "/ws/rest/v1/patient/" + patientUuid + "/attribute",
    payload
  )
}
export async function saveUpiIdentifier(
  upi: string,
  patientUuid: string,
  locationUuid: string
) {
  const payload = {
    identifier: upi,
    identifierType: "cba702b9-4664-4b43-83f1-9ab473cbd64d",
    location: locationUuid,
    preferred: false,
  };

  let httpClient = await client("amrs")
  return await httpClient.axios.post(
    "/ws/rest/v1/patient/" + patientUuid + "/identifier",
    payload
  )
}
