import type { ExecutionContext } from "@nestjs/common";
import { createParamDecorator } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

export interface IRequestInfo {
  ipAddress?: string;
  userAgent?: string;
}

export const RequestInfo = createParamDecorator(
  (_: unknown, context: ExecutionContext): IRequestInfo => {
    if (context.getType() === "http") {
      const req = context.switchToHttp().getRequest();
      return req.requestInfo;
    }

    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext().req;
    return req.requestInfo;
  },
);
