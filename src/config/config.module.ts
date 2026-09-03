import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { envValidationSchema } from "./env.validation";
import { resolve } from "path";
import corsConfig from "./cors.config";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: IS_PRODUCTION,
      envFilePath: IS_PRODUCTION
        ? undefined
        : [
            resolve(process.cwd(), ".env.local"),
            resolve(process.cwd(), ".env.development"),
          ],
      validationSchema: envValidationSchema,
      load: [corsConfig],
    }),
  ],
})
export class AppConfigModule {}
