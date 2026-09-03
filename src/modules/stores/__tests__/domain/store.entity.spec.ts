import { AppException } from "@/common/exceptions/app-exception";
import { Store } from "@/modules/stores/domain/entities/store.entity";

describe("Store.create", () => {
  it("trims the name and normalizes optional fields", () => {
    const store = Store.create({
      name: "  Amore Mio  ",
      legalName: "  Amore Mio LTDA  ",
      cnpj: "12.345.678/0001-99",
      whatsapp: "+55 (11) 99999-8888",
      email: "  Contato@AmoreMio.com  ",
      instagram: "https://instagram.com/amoremio/",
      ifoodUrl: "  https://ifood.com.br/amoremio  ",
      food99Url: "",
      createdByUserId: "user-1",
    });

    expect(store.toPrimitive()).toEqual({
      name: "Amore Mio",
      legalName: "Amore Mio LTDA",
      cnpj: "12345678000199",
      whatsapp: "5511999998888",
      email: "contato@amoremio.com",
      instagram: "amoremio",
      ifoodUrl: "https://ifood.com.br/amoremio",
      food99Url: null,
      createdByUserId: "user-1",
    });
  });

  it("treats a blank legalName / cnpj as null", () => {
    const store = Store.create({
      name: "Loja",
      legalName: "   ",
      cnpj: "",
      createdByUserId: "user-1",
    });

    const primitive = store.toPrimitive();
    expect(primitive.legalName).toBeNull();
    expect(primitive.cnpj).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(() =>
      Store.create({ name: "   ", createdByUserId: "user-1" }),
    ).toThrow(AppException);
  });

  it("rejects a cnpj that is not 14 digits", () => {
    expect(() =>
      Store.create({
        name: "Loja",
        cnpj: "123",
        createdByUserId: "user-1",
      }),
    ).toThrow(AppException);
  });
});
