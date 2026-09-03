import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { PAGE_ACCESS_KEY } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";

@Injectable()
export class PageAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationUseCase: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const page = this.reflector.getAllAndOverride<PageAccessKey>(
      PAGE_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!page) {
      return true;
    }

    const request = this.getRequest(context);
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw AppException.from(APP_ERRORS.auth.userUnauthenticated, undefined);
    }

    await this.authorizationUseCase.assertPageAccessForUserId(
      user.idUsers,
      page,
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
