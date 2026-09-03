import { Field, ObjectType } from "@nestjs/graphql";

// A lightweight { id, name } pair used to populate "created by" style filter
// selects on the client without leaking the full user record.
@ObjectType()
export class UserOptionDto {
  static from(option: { id: string; name: string }): UserOptionDto {
    const dto = new UserOptionDto();
    dto.id = option.id;
    dto.name = option.name;
    return dto;
  }

  @Field()
  id!: string;

  @Field()
  name!: string;
}
