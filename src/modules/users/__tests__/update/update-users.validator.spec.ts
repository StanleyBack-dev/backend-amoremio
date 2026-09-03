import { UpdateUserValidator } from "../../application/validators/update/update-user.validator";

describe("UpdateUserValidator", () => {
  it("should allow update with name", () => {
    expect(() =>
      UpdateUserValidator.ensureValidUpdate({ name: "Novo Nome" }),
    ).not.toThrow();
  });

  it("should allow update with urlAvatar", () => {
    expect(() =>
      UpdateUserValidator.ensureValidUpdate({
        urlAvatar: "https://example.com/avatar.png",
      }),
    ).not.toThrow();
  });

  it("should allow update with status", () => {
    expect(() =>
      UpdateUserValidator.ensureValidUpdate({ status: false }),
    ).not.toThrow();
  });

  it("should throw when no update fields are provided", () => {
    expect(() => UpdateUserValidator.ensureValidUpdate({})).toThrow();
  });
});
