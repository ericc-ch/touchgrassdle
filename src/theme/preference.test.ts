import { describe, expect, it } from "vitest"
import { parsePreference, resolveTheme } from "./preference.ts"

describe("parsePreference", () => {
  it("accepts known preferences", () => {
    expect(parsePreference("light")).toBe("light")
    expect(parsePreference("dark")).toBe("dark")
    expect(parsePreference("system")).toBe("system")
  })

  it("falls back to system for unknown values", () => {
    expect(parsePreference("neon")).toBe("system")
    expect(parsePreference(null)).toBe("system")
    expect(parsePreference(undefined)).toBe("system")
    expect(parsePreference(42)).toBe("system")
  })
})

describe("resolveTheme", () => {
  it("follows explicit preferences regardless of OS", () => {
    expect(resolveTheme("light", true)).toBe("light")
    expect(resolveTheme("light", false)).toBe("light")
    expect(resolveTheme("dark", true)).toBe("dark")
    expect(resolveTheme("dark", false)).toBe("dark")
  })

  it("follows the OS when preference is system", () => {
    expect(resolveTheme("system", true)).toBe("dark")
    expect(resolveTheme("system", false)).toBe("light")
  })
})
