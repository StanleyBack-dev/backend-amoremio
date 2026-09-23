import { Injectable } from "@nestjs/common";
import sharp from "sharp";
import type {
  ImageInfo,
  ImageProcessorPort,
  NormalizedImage,
} from "@/modules/attachments/application/ports/image-processor.port";
import { IMAGE_UPLOAD_RULES } from "@/modules/attachments/domain/policies/image-upload.policy";

const MIME_BY_SHARP_FORMAT: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Only one conversion at a time per instance: libvips is multi-threaded on
// its own, and serverless instances have little memory to spare.
sharp.concurrency(1);
sharp.cache(false);

@Injectable()
export class SharpImageProcessorAdapter implements ImageProcessorPort {
  async inspect(buffer: Buffer): Promise<ImageInfo> {
    const metadata = await this.open(buffer).metadata();
    // EXIF orientations 5-8 are rotated by 90 degrees: the displayed
    // width/height are swapped relative to the stored ones.
    const rotated = (metadata.orientation ?? 1) >= 5;
    return {
      mimeType: MIME_BY_SHARP_FORMAT[metadata.format ?? ""] ?? null,
      width: (rotated ? metadata.height : metadata.width) ?? 0,
      height: (rotated ? metadata.width : metadata.height) ?? 0,
    };
  }

  async normalize(buffer: Buffer): Promise<NormalizedImage> {
    const { output } = IMAGE_UPLOAD_RULES;
    const [main, thumbnail] = await Promise.all([
      this.render(buffer, output.maxDimension),
      this.render(buffer, output.thumbDimension),
    ]);
    return { main, thumbnail, mimeType: output.mimeType };
  }

  private async render(buffer: Buffer, maxDimension: number) {
    // No withMetadata(): sharp drops EXIF/ICC/XMP by default, which strips
    // GPS and device data. rotate() first bakes the EXIF orientation into
    // the pixels so the image still displays upright without it.
    const { data, info } = await this.open(buffer)
      .rotate()
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: IMAGE_UPLOAD_RULES.output.quality })
      .toBuffer({ resolveWithObject: true });
    return { buffer: data, width: info.width, height: info.height };
  }

  private open(buffer: Buffer) {
    return sharp(buffer, {
      limitInputPixels: IMAGE_UPLOAD_RULES.maxInputPixels,
      // Reject truncated or corrupted files instead of rendering garbage.
      failOn: "error",
      // Animated WebP: keep only the first frame.
      animated: false,
    });
  }
}
