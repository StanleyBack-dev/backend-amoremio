import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AUTH_PERMISSIONS_KEY } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";

@Injectable()
export class AuthPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationUseCase: AuthorizationService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.getAllAndOverride<AuthPermission[]>(
      AUTH_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissions?.length) {
      return true;
    }

    const request = this.getRequest(context);
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw AppException.from(APP_ERRORS.auth.userUnauthenticated, undefined);
    }

    this.authorizationUseCase.assertPermissionsForGroup(
      user.group,
      permissions,
    );
    return true;
  }

  private getRequest(context: ExecutionContext) {
    const gqlContext = GqlExecutionContext.create(context);
    const gqlReq = gqlContext.getContext()?.req;
    if (gqlReq) {
      return gqlReq as Record<string, unknown> & { user?: unknown };
    }

    return context
      .switchToHttp()
      .getRequest<Record<string, unknown> & { user?: unknown }>();
  }
}
