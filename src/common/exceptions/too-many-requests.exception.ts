import { HttpException, HttpStatus } from "@nestjs/common";

export class TooManyRequestsException extends HttpException {
  constructor(message?: string) {
    super(
      message || "Muitas requisições. Tente novamente mais tarde.",
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
