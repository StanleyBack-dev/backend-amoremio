import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { TERMS_ACCEPTANCE_REPOSITORY } from "@/modules/legal/application/ports/terms-acceptance-repository.port";
import { AcceptTermsOfUseUseCase } from "@/modules/legal/application/use-cases/accept-terms-of-use.use-case";
import { GetTermsAcceptanceStatusUseCase } from "@/modules/legal/application/use-cases/get-terms-acceptance-status.use-case";
import { TermsAcceptanceEntity } from "@/modules/legal/infrastructure/persistence/typeorm/entities/terms-acceptance.entity";
import { TermsAcceptanceTypeormRepository } from "@/modules/legal/infrastructure/persistence/typeorm/repositories/terms-acceptance-typeorm.repository";
import { LegalResolver } from "@/modules/legal/presentation/graphql/resolvers/legal.resolver";

@Module({
  imports: [TypeOrmModule.forFeature([TermsAcceptanceEntity]), AuthModule],
  providers: [
    AcceptTermsOfUseUseCase,
    GetTermsAcceptanceStatusUseCase,
    LegalResolver,
    TermsAcceptanceTypeormRepository,
    {
      provide: TERMS_ACCEPTANCE_REPOSITORY,
      useExisting: TermsAcceptanceTypeormRepository,
    },
  ],
})
export class LegalModule {}
