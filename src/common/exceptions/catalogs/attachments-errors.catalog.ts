import { HttpStatus } from "@nestjs/common";

export type AttachmentLimitParams = {
  max: number;
};

export type AttachmentSizeParams = {
  maxMegabytes: number;
};

export const attachmentsErrors = {
  notFound: {
    code: "ATTACHMENT_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Anexo não encontrado.",
  },
  ownerTypeNotSupported: {
    code: "ATTACHMENT_OWNER_TYPE_NOT_SUPPORTED",
    status: HttpStatus.BAD_REQUEST,
    message: "Tipo de anexo não suportado.",
  },
  limitReached: {
    code: "ATTACHMENT_LIMIT_REACHED",
    status: HttpStatus.CONFLICT,
    message: ({ max }: AttachmentLimitParams) =>
      `Limite de ${max} imagens atingido.`,
  },
  fileTooLarge: {
    code: "ATTACHMENT_FILE_TOO_LARGE",
    status: HttpStatus.BAD_REQUEST,
    message: ({ maxMegabytes }: AttachmentSizeParams) =>
      `A imagem deve ter no máximo ${maxMegabytes} MB.`,
  },
  fileEmpty: {
    code: "ATTACHMENT_FILE_EMPTY",
    status: HttpStatus.BAD_REQUEST,
    message: "O arquivo enviado está vazio.",
  },
  unsupportedType: {
    code: "ATTACHMENT_UNSUPPORTED_TYPE",
    status: HttpStatus.BAD_REQUEST,
    message: "Formato não suportado. Envie JPEG, PNG ou WebP.",
  },
  invalidImage: {
    code: "ATTACHMENT_INVALID_IMAGE",
    status: HttpStatus.BAD_REQUEST,
    message: "O arquivo não é uma imagem válida.",
  },
  invalidDimensions: {
    code: "ATTACHMENT_INVALID_DIMENSIONS",
    status: HttpStatus.BAD_REQUEST,
    message: "As dimensões da imagem estão fora do permitido.",
  },
  uploadNotFound: {
    code: "ATTACHMENT_UPLOAD_NOT_FOUND",
    status: HttpStatus.BAD_REQUEST,
    message: "O envio da imagem não foi concluído. Tente novamente.",
  },
  uploadExpired: {
    code: "ATTACHMENT_UPLOAD_EXPIRED",
    status: HttpStatus.GONE,
    message: "O envio da imagem expirou. Tente novamente.",
  },
  invalidOrder: {
    code: "ATTACHMENT_INVALID_ORDER",
    status: HttpStatus.BAD_REQUEST,
    message: "A nova ordem deve conter todas as imagens exatamente uma vez.",
  },
  storageNotConfigured: {
    code: "ATTACHMENT_STORAGE_NOT_CONFIGURED",
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: "Armazenamento de arquivos não configurado.",
  },
  storageFailure: {
    code: "ATTACHMENT_STORAGE_FAILURE",
    status: HttpStatus.BAD_GATEWAY,
    message: "Falha ao acessar o armazenamento de arquivos.",
  },
} as const;
