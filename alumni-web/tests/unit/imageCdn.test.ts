import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isPublicSupabaseImageUrl,
  toPublicImageCdnUrl,
} from "../../src/lib/imageCdn";

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalCdnUrl = process.env.NEXT_PUBLIC_IMAGE_CDN_URL;

describe("imageCdn", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_IMAGE_CDN_URL = "https://img.alumni.test";
  });

  afterEach(() => {
    if (originalSupabaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    }

    if (originalCdnUrl === undefined) {
      delete process.env.NEXT_PUBLIC_IMAGE_CDN_URL;
    } else {
      process.env.NEXT_PUBLIC_IMAGE_CDN_URL = originalCdnUrl;
    }
  });

  it("reconoce objetos públicos del Storage del proyecto", () => {
    expect(
      isPublicSupabaseImageUrl(
        "https://project.supabase.co/storage/v1/object/public/avatars/a.jpg"
      )
    ).toBe(true);
  });

  it("rechaza una URL pública perteneciente a otro origen", () => {
    expect(
      isPublicSupabaseImageUrl(
        "https://other.supabase.co/storage/v1/object/public/avatars/a.jpg"
      )
    ).toBe(false);
  });

  it("convierte una imagen pública al CDN preservando ruta y query string", () => {
    const result = toPublicImageCdnUrl(
      "https://project.supabase.co/storage/v1/object/public/posts/photo.webp?width=900"
    );

    expect(result).toBe(
      "https://img.alumni.test/storage/v1/object/public/posts/photo.webp?width=900"
    );
  });

  it("deja intacta una URL externa", () => {
    const source = "https://example.com/photo.webp";

    expect(toPublicImageCdnUrl(source)).toBe(source);
  });
});
