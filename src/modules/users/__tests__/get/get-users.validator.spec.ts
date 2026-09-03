import { GetUserValidator } from "../../application/validators/get/get-user.validator";

describe("GetUserValidator", () => {
  it("should allow lookup by idUsers", () => {
    expect(() =>
      GetUserValidator.ensureValidInput({ idUsers: "uuid-id" }),
    ).not.toThrow();
  });

  it("should allow lookup by email", () => {
    expect(() =>
      GetUserValidator.ensureValidInput({ email: "mail@example.com" }),
    ).not.toThrow();
  });

  it("should throw when both idUsers and email are missing", () => {
    expect(() => GetUserValidator.ensureValidInput({})).toThrow();
  });
});
