// LIBS
import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";

// INTERCEPTORS
import { AppController } from "@/app.controller";
import { formatGraphqlError } from "@/common/exceptions/graphql-error.formatter";
import { RateLimitGuard } from "@/common/guards/rate-limit.guard";
import { RateLimiterService } from "@/common/rate-limit/rate-limiter.service";
import { UpstashRedisProvider } from "@/common/rate-limit/upstash-redis.provider";
import { RequestInfoInterceptor } from "@/common/interceptors/request-info.interceptors";
import { AppConfigModule } from "@/config/config.module";
import { DatabaseModule } from "@/database/database.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { BrandsModule } from "@/modules/brands/brands.module";
import { CatalogModule } from "@/modules/catalog/catalog.module";
import { InventoryModule } from "@/modules/inventory/inventory.module";
import { ExcelGeneratorModule } from "@/modules/excel-generator/excel-generator.module";
import { FinanceDashboardModule } from "@/modules/finance-dashboard/finance-dashboard.module";
import { LegalModule } from "@/modules/legal/legal.module";
import { MailModule } from "@/modules/mails/mail.module";
import { PdfGeneratorModule } from "@/modules/pdf-generator/pdf-generator.module";
import { ProductionModule } from "@/modules/production/production.module";
import { PurchasingModule } from "@/modules/purchasing/purchasing.module";
import { SalesModule } from "@/modules/sales/sales.module";
import { StoresModule } from "@/modules/stores/stores.module";
import { SuppliersModule } from "@/modules/suppliers/suppliers.module";
import { UsersModule } from "@/modules/users/users.module";

@Module({
  controllers: [AppController],
  imports: [
    AppConfigModule,
    DatabaseModule,
    MailModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile:
        process.env.NODE_ENV === "production"
          ? true
          : join(process.cwd(), "src/graphql/schema.gql"),
      playground: true,
      context: ({ req, res }) => ({ req, res }),
      formatError: formatGraphqlError,
    }),
    AuthModule,
    UsersModule,
    StoresModule,
    CatalogModule,
    BrandsModule,
    SuppliersModule,
    InventoryModule,
    PurchasingModule,
    SalesModule,
    ProductionModule,
    FinanceDashboardModule,
    PdfGeneratorModule,
    ExcelGeneratorModule,
    LegalModule,
  ],
  providers: [
    UpstashRedisProvider,
    RateLimiterService,
    RequestInfoInterceptor,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestInfoInterceptor,
    },
  ],
})
export class AppModule {}
