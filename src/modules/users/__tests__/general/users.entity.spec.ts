import { UserEntity } from "../../infrastructure/persistence/typeorm/entities/user.entity";

describe("UserEntity", () => {
  it("should be defined", () => {
    expect(new UserEntity()).toBeDefined();
  });
});
