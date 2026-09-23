export type ImageInfo = {
  // Decoded format as a mime type ("image/jpeg"...), or null when the
  // decoder recognizes it but it has no mime mapping.
  mimeType: string | null;
  width: number;
  height: number;
};

export type NormalizedImage = {
  main: { buffer: Buffer; width: number; height: number };
  thumbnail: { buffer: Buffer; width: number; height: number };
  mimeType: string;
};

export interface ImageProcessorPort {
  // Decodes the header and fails on anything that isn't a readable image.
  inspect(buffer: Buffer): Promise<ImageInfo>;
  // Fully decodes, auto-orients, resizes and re-encodes to the canonical
  // output format, dropping all metadata.
  normalize(buffer: Buffer): Promise<NormalizedImage>;
}

export const IMAGE_PROCESSOR = Symbol("IMAGE_PROCESSOR");
