import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, scoreColor, scoreBg } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats millions", () => expect(formatCurrency(12_000_000)).toBe("$12.0M"));
  it("formats billions", () => expect(formatCurrency(1_500_000_000)).toBe("$1.5B"));
  it("formats thousands", () => expect(formatCurrency(500_000)).toBe("$500K"));
  it("formats small amounts", () => expect(formatCurrency(100)).toContain("100"));
});

describe("formatDate", () => {
  it("returns formatted date string", () => {
    const result = formatDate("2026-05-14");
    expect(result).toContain("2026");
    expect(result).toContain("May");
  });
  it("accepts Date objects", () => {
    // Use a mid-month date to avoid timezone boundary shifting to prior year
    expect(formatDate(new Date("2026-06-15"))).toContain("2026");
  });
});

describe("scoreColor", () => {
  it("returns green for 80+", () => expect(scoreColor(85)).toContain("emerald"));
  it("returns amber for 60-79", () => expect(scoreColor(70)).toContain("amber"));
  it("returns red for <60", () => expect(scoreColor(45)).toContain("red"));
  it("boundary 80 is green", () => expect(scoreColor(80)).toContain("emerald"));
  it("boundary 60 is amber", () => expect(scoreColor(60)).toContain("amber"));
});

describe("scoreBg", () => {
  it("returns emerald class for high scores", () => expect(scoreBg(90)).toContain("emerald"));
  it("returns amber class for mid scores", () => expect(scoreBg(65)).toContain("amber"));
  it("returns red class for low scores", () => expect(scoreBg(30)).toContain("red"));
});
