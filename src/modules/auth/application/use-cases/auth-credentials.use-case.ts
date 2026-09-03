import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

interface ProvisionCredentialInput {
  idUsers: string;
  username: string;
  passwordHash: string;
}

@Injectable()
export class AuthCredentialsService {
  constructor(
    @InjectRepository(AuthCredentialEntity)
    private readonly authCredentialRepository: Repository<AuthCredentialEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findByUsername(username: string): Promise<AuthCredentialEntity | null> {
    return this.authCredentialRepository.findOne({
      where: { username },
      relations: ["user"],
    });
  }

  async findByUserId(idUsers: string): Promise<AuthCredentialEntity | null> {
    return this.authCredentialRepository.findOne({
      where: { idUsers },
      relations: ["user"],
    });
  }

  async findByUserIdOrFail(idUsers: string): Promise<AuthCredentialEntity> {
    const credential = await this.findByUserId(idUsers);

    if (!credential) {
      throw AppException.from(
        APP_ERRORS.auth.credentialNotFoundForUser,
        undefined,
      );
    }

    return credential;
  }

  async provisionCredential(
    input: ProvisionCredentialInput,
  ): Promise<AuthCredentialEntity> {
    const user = await this.userRepository.findOne({
      where: { idUsers: input.idUsers },
    });

    if (!user) {
      throw AppException.from(
        APP_ERRORS.auth.credentialProvisionUserNotFound,
        undefined,
      );
    }

    const existingUserCredential = await this.findByUserId(input.idUsers);
    if (existingUserCredential) {
      throw AppException.from(
        APP_ERRORS.auth.credentialAlreadyExistsForUser,
        undefined,
      );
    }

    const existingUsername = await this.authCredentialRepository.findOne({
      where: { username: input.username },
    });
    if (existingUsername) {
      throw AppException.from(APP_ERRORS.auth.duplicateUsername, undefined);
    }

    const credential = this.authCredentialRepository.create({
      idUsers: input.idUsers,
      username: input.username,
      passwordHash: input.passwordHash,
      mustChangePassword: true,
      onboardingTourCompleted: false,
      temporaryPasswordCreatedAt: new Date(),
      failedLoginAttempts: 0,
    });

    return this.authCredentialRepository.save(credential);
  }

  async assertNotLocked(credential: AuthCredentialEntity): Promise<void> {
    if (credential.lockUntil && credential.lockUntil > new Date()) {
      throw AppException.from(APP_ERRORS.auth.credentialLocked, undefined);
    }
  }

  // Only call this AFTER the caller has proven the requester owns the
  // account (password verified). An account disabled by an admin stays
  // blocked.
  async ensureAccountActiveOrReactivate(
    credential: AuthCredentialEntity,
  ): Promise<void> {
    const { user } = credential;

    if (user.status && !user.inactivatedAt) {
      return;
    }

    throw AppException.from(APP_ERRORS.auth.inactiveUser, undefined);
  }

  async registerFailedLogin(credential: AuthCredentialEntity): Promise<void> {
    const newAttempts = credential.failedLoginAttempts + 1;

    if (newAttempts >= 5) {
      await this.authCredentialRepository.update(
        { idAuthCredentials: credential.idAuthCredentials },
        {
          failedLoginAttempts: 0,
          lockUntil: new Date(Date.now() + 15 * 60 * 1000),
        },
      );
    } else {
      await this.authCredentialRepository.update(
        { idAuthCredentials: credential.idAuthCredentials },
        { failedLoginAttempts: newAttempts },
      );
    }
  }

  async registerSuccessfulLogin(
    credential: AuthCredentialEntity,
  ): Promise<void> {
    await this.authCredentialRepository.update(
      { idAuthCredentials: credential.idAuthCredentials },
      {
        failedLoginAttempts: 0,
        lockUntil: null,
        lastLoginAt: new Date(),
      },
    );
  }

  async completeOnboardingTour(idUsers: string): Promise<void> {
    await this.authCredentialRepository.update(
      { idUsers },
      { onboardingTourCompleted: true },
    );
  }

  async acceptTermsOfUse(
    idUsers: string,
    acceptedAt: Date,
    termsVersion: string,
  ): Promise<void> {
    await this.authCredentialRepository.update(
      { idUsers },
      { termsAcceptedAt: acceptedAt, termsAcceptedVersion: termsVersion },
    );
  }

  async updatePassword(
    credential: AuthCredentialEntity,
    passwordHash: string,
  ): Promise<AuthCredentialEntity> {
    await this.authCredentialRepository.update(
      { idAuthCredentials: credential.idAuthCredentials },
      {
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    );

    return (await this.findByUserId(credential.idUsers))!;
  }
}
