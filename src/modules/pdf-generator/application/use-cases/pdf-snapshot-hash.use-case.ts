import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";

@Injectable()
export class PdfSnapshotHashService {
  hashSnapshot(snapshot: unknown): string {
    const serialized = JSON.stringify(snapshot);
    return createHash("sha256").update(serialized).digest("hex");
  }
}
