import { SessionEntity } from "../../infrastructure/persistence/typeorm/entities/session.entity";

describe("SessionEntity", () => {
  it("should be defined", () => {
    expect(new SessionEntity()).toBeDefined();
  });
});
