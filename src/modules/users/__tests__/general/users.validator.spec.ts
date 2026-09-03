import { UserValidator } from "../../application/validators/user.validator";
import { userMock } from "../../__mocks__/user.mock";

describe("UserValidator", () => {
  it("should allow active user", () => {
    expect(() => UserValidator.ensureIsActive(userMock)).not.toThrow();
  });

  it("should throw for inactive user", () => {
    expect(() =>
      UserValidator.ensureIsActive({ ...userMock, status: false }),
    ).toThrow();
  });

  it("should allow valid email", () => {
    expect(() => UserValidator.ensureHasEmail(userMock)).not.toThrow();
  });

  it("should throw for invalid email", () => {
    expect(() =>
      UserValidator.ensureHasEmail({ ...userMock, email: "invalid-email" }),
    ).toThrow();
  });
});
