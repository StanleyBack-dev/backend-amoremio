// LIBS
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

// ENTITIES
import { SessionEntity } from "@/modules/sessions/infrastructure/persistence/typeorm/entities/session.entity";
import { UserEntity } from "../users/infrastructure/persistence/typeorm/entities/user.entity";

// USE CASES
import { CreateSessionUseCase } from "@/modules/sessions/application/use-cases/create/create-session.use-case";
import { ValidateSessionUseCase } from "@/modules/sessions/application/use-cases/validate/validate-session.use-case";
import { RefreshSessionUseCase } from "@/modules/sessions/application/use-cases/refresh/refresh-session.use-case";
import { RevokeSessionUseCase } from "@/modules/sessions/application/use-cases/revoke/revoke-session.use-case";
import { SaveSessionUseCase } from "@/modules/sessions/application/use-cases/save/save-session.use-case";

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity, UserEntity])],
  providers: [
    CreateSessionUseCase,
    ValidateSessionUseCase,
    RefreshSessionUseCase,
    RevokeSessionUseCase,
    SaveSessionUseCase,
  ],
  exports: [
    CreateSessionUseCase,
    ValidateSessionUseCase,
    RefreshSessionUseCase,
    RevokeSessionUseCase,
    SaveSessionUseCase,
  ],
})
export class SessionsModule {}
