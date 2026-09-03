import { Injectable } from "@nestjs/common";
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(nodeScrypt);

@Injectable()
export class PasswordHasherService {
  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    return `${salt}:${derivedKey.toString("hex")}`;
  }

  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [salt, storedKey] = storedHash.split(":");

    if (!salt || !storedKey) {
      return false;
    }

    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const storedKeyBuffer = Buffer.from(storedKey, "hex");

    if (storedKeyBuffer.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(storedKeyBuffer, derivedKey);
  }

  generateTemporaryPassword(length = 12): string {
    const raw = randomBytes(length).toString("base64url");
    return raw.slice(0, length);
  }
}
