"use client";

interface Props {
  pendingLabel: string;
}

export function GlobeLoader({ pendingLabel }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 gap-10"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        <div
          className="absolute rounded-full border border-signal/20 animate-ping pointer-events-none"
          style={{ width: 176, height: 176, animationDuration: "2.8s" }}
        />
        <div
          className="absolute rounded-full border border-cable/15 animate-ping pointer-events-none"
          style={{ width: 176, height: 176, animationDuration: "2.8s", animationDelay: "1.4s" }}
        />

        <div style={{ perspective: "640px" }}>
          <div
            className="globe-spinner relative"
            style={{
              width: 160,
              height: 160,
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(245,166,35,0.08) 0%, rgba(94,234,212,0.04) 40%, transparent 70%)",
              }}
            />

            <div
              className="absolute inset-0 rounded-full"
              style={{ border: "1.5px solid rgba(245,166,35,0.75)", transform: "rotateY(0deg)" }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: "1px solid rgba(94,234,212,0.45)", transform: "rotateY(60deg)" }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: "1px solid rgba(94,234,212,0.30)", transform: "rotateY(120deg)" }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: "1px solid rgba(94,234,212,0.40)", transform: "rotateX(90deg)" }}
            />
            <div
              className="absolute rounded-full"
              style={{
                inset: "20%",
                border: "1px solid rgba(94,234,212,0.18)",
                transform: "rotateX(90deg)",
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-2.5 h-2.5 rounded-full bg-signal"
                style={{
                  boxShadow:
                    "0 0 0 3px rgba(245,166,35,0.15), 0 0 18px 6px rgba(245,166,35,0.45)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <p className="text-mist text-xs font-mono tracking-wide">{pendingLabel}</p>
    </div>
  );
}
