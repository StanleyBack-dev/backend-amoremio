import { extractClientIp } from "@/common/utils/extract-client-ip.util";

function buildRequest(overrides: {
  forwardedFor?: string | string[];
  remoteAddress?: string;
}) {
  return {
    headers: { "x-forwarded-for": overrides.forwardedFor },
    socket: { remoteAddress: overrides.remoteAddress },
  } as never;
}

describe("extractClientIp", () => {
  it("returns the first entry of a comma-separated x-forwarded-for header", () => {
    const request = buildRequest({
      forwardedFor: "203.0.113.9, 70.41.3.18, 150.172.238.178",
    });

    expect(extractClientIp(request)).toBe("203.0.113.9");
  });

  it("trims whitespace around the first entry", () => {
    const request = buildRequest({
      forwardedFor: "  203.0.113.9  , 70.41.3.18",
    });

    expect(extractClientIp(request)).toBe("203.0.113.9");
  });

  it("returns the first element when the header arrives as an array", () => {
    const request = buildRequest({
      forwardedFor: ["203.0.113.9", "70.41.3.18"],
    });

    expect(extractClientIp(request)).toBe("203.0.113.9");
  });

  it("falls back to the socket remote address when the header is missing", () => {
    const request = buildRequest({ remoteAddress: "127.0.0.1" });

    expect(extractClientIp(request)).toBe("127.0.0.1");
  });

  it("returns undefined when neither the header nor the socket address exist", () => {
    const request = buildRequest({});

    expect(extractClientIp(request)).toBeUndefined();
  });
});
