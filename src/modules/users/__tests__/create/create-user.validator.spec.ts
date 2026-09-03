import { UserGroup } from "../../domain/enums/user-group.enum";
import { CreateUserInputDto } from "../../presentation/graphql/dtos/create/create-user-input.dto";

describe("CreateUserInputDto", () => {
  it("should initialize with default group", () => {
    const input = new CreateUserInputDto();
    expect(input.group).toBe(UserGroup.USER);
  });

  it("should accept valid fields", () => {
    const input = new CreateUserInputDto();
    input.name = "Novo Usuario";
    input.email = "novo.usuario@example.com";
    input.username = "novo.usuario";
    input.group = UserGroup.ADMIN;
    input.urlAvatar = "https://example.com/avatar.png";

    expect(input.name).toBe("Novo Usuario");
    expect(input.group).toBe(UserGroup.ADMIN);
  });
});
