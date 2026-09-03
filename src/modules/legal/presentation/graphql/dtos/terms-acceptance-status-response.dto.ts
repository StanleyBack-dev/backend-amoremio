import { Field, ObjectType } from "@nestjs/graphql";
import type { TermsAcceptanceStatusView } from "@/modules/legal/application/use-cases/get-terms-acceptance-status.use-case";

@ObjectType()
export class TermsAcceptanceStatusResponseDto {
  static fromView(
    view: TermsAcceptanceStatusView,
  ): TermsAcceptanceStatusResponseDto {
    const dto = new TermsAcceptanceStatusResponseDto();
    dto.accepted = view.accepted;
    dto.acceptedAt = view.acceptedAt ?? undefined;
    dto.termsVersion = view.termsVersion ?? undefined;
    return dto;
  }

  @Field()
  accepted!: boolean;

  @Field(() => Date, { nullable: true })
  acceptedAt?: Date;

  @Field(() => String, { nullable: true })
  termsVersion?: string;
}
