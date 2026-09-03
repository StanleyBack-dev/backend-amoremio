import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class RequestInfoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    let req: Record<string, unknown>;

    if (context.getType() === "http") {
      req = context.switchToHttp().getRequest();
    } else {
      const gqlCtx = GqlExecutionContext.create(context);
      req = gqlCtx.getContext().req as Record<string, unknown>;
    }

    if (!req) {
      return next.handle();
    }

    const headers = req.headers as Record<string, string> | undefined;
    const socket = req.socket as { remoteAddress?: string } | undefined;
    const ipAddress =
      (headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      socket?.remoteAddress ||
      "Unknown";

    const userAgent = headers?.["user-agent"] || "Unknown";

    (
      req as Record<string, unknown> & {
        requestInfo?: { ipAddress: string; userAgent: string };
      }
    ).requestInfo = {
      ipAddress,
      userAgent,
    };

    return next.handle();
  }
}
