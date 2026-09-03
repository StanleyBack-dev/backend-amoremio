import { UserEntity } from "../../infrastructure/persistence/typeorm/entities/user.entity";

describe("CreateUserEntity", () => {
  it("should be defined", () => {
    expect(new UserEntity()).toBeDefined();
  });
});
