import { timingSafeEqual } from "crypto";
import { Controller, Get, Headers, HttpCode, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Public } from "@/common/decorators/public.decorator";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { CleanupStaleUploadsUseCase } from "@/modules/attachments/application/use-cases/cleanup-stale-uploads.use-case";

// Invoked by the Vercel cron (see vercel.json), which authenticates with
// `Authorization: Bearer $CRON_SECRET`. Public to the user auth guard on
// purpose: the shared secret is the credential here.
@Controller("internal/attachments")
export class AttachmentsMaintenanceController {
  constructor(
    private readonly configService: ConfigService,
    private readonly cleanupStaleUploadsUseCase: CleanupStaleUploadsUseCase,
  ) {}

  @Public()
  @Get("cleanup-stale-uploads")
  @HttpCode(HttpStatus.OK)
  async cleanupStaleUploads(
    @Headers("authorization") authorization?: string,
  ): Promise<{ removed: number }> {
    this.assertCronSecret(authorization);
    return this.cleanupStaleUploadsUseCase.execute();
  }

  private assertCronSecret(authorization?: string): void {
    const secret = this.configService.get<string>("CRON_SECRET");
    const expected = Buffer.from(`Bearer ${secret ?? ""}`);
    const received = Buffer.from(authorization ?? "");
    const valid =
      Boolean(secret) &&
      expected.length === received.length &&
      timingSafeEqual(expected, received);
    if (!valid) {
      throw AppException.from(APP_ERRORS.auth.accessTokenMissing, undefined);
    }
  }
}
