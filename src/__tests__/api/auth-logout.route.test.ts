import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  it("expira o cookie da sessão", async () => {
    const response = await POST();
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(cookie).toContain("session=");
    expect(cookie.toLowerCase()).toContain("expires=thu, 01 jan 1970");
  });
});
