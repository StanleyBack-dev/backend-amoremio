export class UpdateStoreCommand {
  idStore!: string;
  name?: string;
  legalName?: string | null;
  cnpj?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  ifoodUrl?: string | null;
  food99Url?: string | null;
  status?: boolean;
}
