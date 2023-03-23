import { createPool } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const ETL_POOL = createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 10,
});

export const AMRS_POOL = createPool({
  host: process.env.DB_AMRS_HOST,
  port: Number(process.env.DB_AMRS_PORT),
  user: process.env.DB_AMRS_USER,
  password: process.env.DB_AMRS_PASSWORD,
  database: process.env.DB_AMRS_DATABASE,
  connectionLimit: 10,
});
