import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { IS_PUBLIC_KEY } from "@/common/decorators/public.decorator";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { ALLOW_BEFORE_TERMS_ACCEPTANCE_KEY } from "@/modules/auth/presentation/decorators/allow-before-terms-acceptance.decorator";
import { AuthCredentialsService } from "@/modules/auth/application/use-cases/auth-credentials.use-case";
import { CURRENT_TERMS_VERSION } from "@/modules/legal/domain/constants/terms-version.constant";

// Server-side enforcement of terms acceptance: the frontend gate is a UX
// affordance the user could bypass by tampering with the DOM, so this is the
// real backstop preventing account usage without a recorded acceptance.
@Injectable()
export class TermsAcceptanceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authCredentialsUseCase: AuthCredentialsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const allowBeforeTermsAcceptance =
      this.reflector.getAllAndOverride<boolean>(
        ALLOW_BEFORE_TERMS_ACCEPTANCE_KEY,
        [context.getHandler(), context.getClass()],
      );
    if (allowBeforeTermsAcceptance) {
      return true;
    }

    const request = this.getRequest(context);
    const currentUser = request.user as { idUsers?: string } | undefined;

    if (!currentUser?.idUsers) {
      return true;
    }

    const credential = await this.authCredentialsUseCase.findByUserId(
      currentUser.idUsers,
    );

    if (
      credential?.termsAcceptedAt &&
      credential.termsAcceptedVersion === CURRENT_TERMS_VERSION
    ) {
      return true;
    }

    throw AppException.from(APP_ERRORS.auth.termsAcceptancePending, undefined);
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
