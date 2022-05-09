import { Server } from "@hapi/hapi";
import { getPatientIdentifiers } from "./helpers/patient";

const init = async () => {
  const server = new Server({
    port: 3000,
    host: "localhost",
  });
  server.route({
    method: "GET",
    path: "/identifier",
    handler: async function (request, h) {
      let patientUUID = request.query;
      let identifiers: PatientPayload.PatientIdentifier[] = await getPatientIdentifiers(
        patientUUID.uuid
      );
      return identifiers;
    },
  });
  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
