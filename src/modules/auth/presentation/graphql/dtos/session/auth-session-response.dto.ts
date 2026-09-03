import { Field, ObjectType } from "@nestjs/graphql";
import { AuthUserDto } from "./auth-user.dto";

@ObjectType()
export class AuthSessionResponseDto {
  @Field()
  authenticated!: boolean;

  @Field()
  mustChangePassword!: boolean;

  @Field()
  onboardingTourCompleted!: boolean;

  @Field()
  termsAccepted!: boolean;

  // True when the user accepted an OLDER version before — lets the frontend
  // gate say "we updated our terms" instead of the generic first-time copy.
  @Field()
  isTermsReacceptance!: boolean;

  @Field(() => AuthUserDto)
  user!: AuthUserDto;
}
