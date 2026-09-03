import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { AppException } from "../exceptions/app-exception";
import { APP_ERRORS } from "../exceptions/app-errors.catalog";
import { ACCESS_TOKEN_COOKIE_NAME } from "../../config/cookie.config";
import { AuthTokensService } from "../../modules/auth/application/use-cases/auth-tokens.use-case";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authTokensService: AuthTokensService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = this.getRequest(context);
    const token = this.extractAccessToken(request);

    if (!token) {
      throw AppException.from(APP_ERRORS.auth.accessTokenMissing, undefined);
    }

    const payload = this.authTokensService.verifyAccessToken(token);

    request.user = {
      idUsers: payload.uid,
      username: payload.username,
      group: payload.group,
    };

    return true;
  }

  private getRequest(context: ExecutionContext) {
    const gqlContext = GqlExecutionContext.create(context);
    const gqlReq = gqlContext.getContext()?.req;
    if (gqlReq) {
      return gqlReq as Record<string, unknown> & {
        cookies?: Record<string, string>;
        headers?: Record<string, string | string[] | undefined>;
        user?: unknown;
      };
    }

    return context.switchToHttp().getRequest<
      Record<string, unknown> & {
        cookies?: Record<string, string>;
        headers?: Record<string, string | string[] | undefined>;
        user?: unknown;
      }
    >();
  }

  private extractAccessToken(
    request: Record<string, unknown> & {
      cookies?: Record<string, string>;
      headers?: Record<string, string | string[] | undefined>;
    },
  ): string | undefined {
    const cookieToken = request.cookies?.[ACCESS_TOKEN_COOKIE_NAME];
    if (cookieToken) {
      return cookieToken;
    }

    const authorization = request.headers?.authorization;
    const headerValue = Array.isArray(authorization)
      ? authorization[0]
      : authorization;

    if (!headerValue?.startsWith("Bearer ")) {
      return undefined;
    }

    return headerValue.slice(7);
  }
}
