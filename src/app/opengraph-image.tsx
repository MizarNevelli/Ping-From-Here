import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ping From Here: How far are you from the cloud?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#0A1628",
          padding: "80px 80px",
          fontFamily: "serif",
        }}
      >
        {/* Left column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            flex: 1,
            paddingRight: "80px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "#F5F0E8",
              lineHeight: 1.05,
              letterSpacing: "-1px",
            }}
          >
            Ping From Here
          </div>

          <div
            style={{
              fontSize: "28px",
              color: "#94A3B8",
              lineHeight: 1.4,
              fontFamily: "monospace",
            }}
          >
            How far are you from the cloud?
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "8px",
            }}
          >
            {["AWS", "GCP", "Cloudflare"].map((p) => (
              <div
                key={p}
                style={{
                  background: "rgba(45, 212, 191, 0.12)",
                  border: "1px solid rgba(45, 212, 191, 0.35)",
                  borderRadius: "6px",
                  padding: "6px 16px",
                  color: "#2DD4BF",
                  fontSize: "20px",
                  fontFamily: "monospace",
                }}
              >
                {p}
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: "20px",
              color: "#64748B",
              fontFamily: "monospace",
              marginTop: "8px",
            }}
          >
            28 regions measured in your browser
          </div>
        </div>

        {/* Right column — radar graphic */}
        <div
          style={{
            position: "relative",
            width: "320px",
            height: "320px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {/* Rings */}
          {[320, 220, 140, 80].map((diameter, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: `${diameter}px`,
                height: `${diameter}px`,
                borderRadius: "50%",
                border: `1px solid rgba(45, 212, 191, ${0.12 + i * 0.08})`,
              }}
            />
          ))}

          {/* Crosshair H */}
          <div
            style={{
              position: "absolute",
              width: "280px",
              height: "1px",
              background: "rgba(45, 212, 191, 0.15)",
            }}
          />
          {/* Crosshair V */}
          <div
            style={{
              position: "absolute",
              width: "1px",
              height: "280px",
              background: "rgba(45, 212, 191, 0.15)",
            }}
          />

          {/* Center dot */}
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "#F59E0B",
              boxShadow: "0 0 20px 6px rgba(245, 158, 11, 0.45)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
