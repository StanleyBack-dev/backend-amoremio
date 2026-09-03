import { UserEntity } from "../../infrastructure/persistence/typeorm/entities/user.entity";

describe("UpdateUsersEntity", () => {
  it("should be defined", () => {
    expect(new UserEntity()).toBeDefined();
  });
});
