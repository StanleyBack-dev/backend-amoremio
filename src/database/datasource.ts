import { DataSource } from "typeorm";
import { config } from "dotenv";
import { join } from "path";

config({ path: `.env.${process.env.NODE_ENV || "development"}` });

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  extra: {
    options: `-c timezone=${process.env.DB_TIMEZONE || "America/Sao_Paulo"}`,
  },
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === "true",
  entities: [join(__dirname, "../modules/**/*.entity.{ts,js}")],
  migrations: [join(__dirname, "./migrations/*.{ts,js}")],
});
