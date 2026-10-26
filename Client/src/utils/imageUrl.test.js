import { describe, it, expect } from "vitest";
import { resolveImageUrl } from "./imageUrl";

describe("resolveImageUrl", () => {
  it("keeps server upload paths relative in development (Vite forwards /uploads to the backend)", () => {
    expect(resolveImageUrl("/uploads/products/a.png", "")).toBe("/uploads/products/a.png");
  });

  it("prefixes server upload paths with the API address in production", () => {
    expect(resolveImageUrl("/uploads/products/a.png", "https://api.example.com/")).toBe("https://api.example.com/uploads/products/a.png");
    expect(resolveImageUrl("/uploads/products/a.png", "https://api.example.com")).toBe("https://api.example.com/uploads/products/a.png");
  });

  it("leaves other images untouched", () => {
    const base = "https://api.example.com";
    expect(resolveImageUrl("https://cdn.example.com/x.png", base)).toBe("https://cdn.example.com/x.png");
    expect(resolveImageUrl("data:image/png;base64,AAAA", base)).toBe("data:image/png;base64,AAAA");
    expect(resolveImageUrl("blob:http://localhost:5173/abc", base)).toBe("blob:http://localhost:5173/abc");
    expect(resolveImageUrl("/src/assets/images/Bra.jpg", base)).toBe("/src/assets/images/Bra.jpg");
    expect(resolveImageUrl(null, base)).toBeNull();
    expect(resolveImageUrl("", base)).toBe("");
  });
});
