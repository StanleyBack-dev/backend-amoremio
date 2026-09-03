import { Field, InputType, Int } from "@nestjs/graphql";
import { IsInt, IsOptional, Max, Min } from "class-validator";

@InputType({ isAbstract: true })
export abstract class PaginationInputDto {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
