import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("production API connection", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_BACKEND_URL", "");
    delete window.ALDEF_CONFIG;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    delete window.ALDEF_CONFIG;
  });

  it("sends API login and CSRF to the configured backend with session cookies", async () => {
    vi.stubEnv("DEV", false);
    window.ALDEF_CONFIG = { backendUrl: "https://be-wms.aldeftech.com/" };
    const axios = (await import("axios")).default;
    const csrf = vi.spyOn(axios, "get").mockResolvedValue({ data: null });
    const { api, login } = await import("./api");
    const post = vi
      .spyOn(api, "post")
      .mockResolvedValue({ data: { user: { id: 1 } } });
    await login("operator@example.com", "test-password");
    expect(api.defaults.baseURL).toBe("https://be-wms.aldeftech.com/api/v1");
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.withXSRFToken).toBe(true);
    expect(csrf).toHaveBeenCalledWith(
      "https://be-wms.aldeftech.com/sanctum/csrf-cookie",
      { withCredentials: true },
    );
    expect(post).toHaveBeenCalledWith("/login", {
      email: "operator@example.com",
      password: "test-password",
    });
  });

  it("keeps local development on its proxy instead of calling production", async () => {
    vi.stubEnv("DEV", true);
    window.ALDEF_CONFIG = { backendUrl: "https://be-wms.aldeftech.com" };
    const { api } = await import("./api");
    expect(api.defaults.baseURL).toBe("/api/v1");
  });

  it("uses the build environment when runtime configuration is absent", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_BACKEND_URL", "https://api.example.com");
    const { api } = await import("./api");
    expect(api.defaults.baseURL).toBe("https://api.example.com/api/v1");
  });
});
