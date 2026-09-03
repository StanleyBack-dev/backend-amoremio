import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { AuthTokenPayload } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { parseDurationToMs } from "../utils/duration.util";

const MIN_REFRESH_DURATION_MS = parseDurationToMs("30d");

@Injectable()
export class AuthTokensService {
  constructor(private readonly configService: ConfigService) {}

  signAccessToken(user: UserEntity, username: string): string {
    return sign(
      this.buildPayload(user, username, "access"),
      this.getAccessSecret(),
      {
        expiresIn: Math.floor(this.getAccessTokenMaxAgeMs() / 1000),
      },
    );
  }

  signRefreshToken(user: UserEntity, username: string): string {
    return sign(
      this.buildPayload(user, username, "refresh"),
      this.getRefreshSecret(),
      {
        expiresIn: Math.floor(this.getRefreshTokenMaxAgeMs() / 1000),
      },
    );
  }

  verifyAccessToken(token: string): AuthTokenPayload {
    return this.verifyToken(token, this.getAccessSecret(), "access");
  }

  verifyRefreshToken(token: string): AuthTokenPayload {
    return this.verifyToken(token, this.getRefreshSecret(), "refresh");
  }

  getAccessTokenMaxAgeMs(): number {
    return parseDurationToMs(this.getAccessExpiresIn());
  }

  getRefreshTokenMaxAgeMs(): number {
    return Math.max(
      parseDurationToMs(this.getRefreshExpiresIn()),
      MIN_REFRESH_DURATION_MS,
    );
  }

  private verifyToken(
    token: string,
    secret: string,
    expectedType: AuthTokenPayload["type"],
  ): AuthTokenPayload {
    try {
      const payload = verify(token, secret) as
        | string
        | (JwtPayload & AuthTokenPayload);

      if (typeof payload === "string" || payload.type !== expectedType) {
        throw AppException.from(APP_ERRORS.auth.invalidToken, undefined);
      }

      return {
        sub: payload.sub,
        uid: payload.uid,
        username: payload.username,
        group: payload.group,
        type: payload.type,
      };
    } catch {
      throw AppException.from(APP_ERRORS.auth.invalidOrExpiredToken, undefined);
    }
  }

  private buildPayload(
    user: UserEntity,
    username: string,
    type: AuthTokenPayload["type"],
  ): AuthTokenPayload {
    return {
      sub: user.idUsers,
      uid: user.idUsers,
      username,
      group: user.group,
      type,
    };
  }

  private getAccessSecret(): string {
    return this.configService.get<string>("JWT_ACCESS_SECRET") ?? "";
  }

  private getRefreshSecret(): string {
    return this.configService.get<string>("JWT_REFRESH_SECRET") ?? "";
  }

  private getAccessExpiresIn(): string {
    return this.configService.get<string>("JWT_ACCESS_EXPIRES_IN") ?? "15m";
  }

  private getRefreshExpiresIn(): string {
    return this.configService.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "30d";
  }
}
