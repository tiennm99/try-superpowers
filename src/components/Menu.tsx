interface MenuProps {
  onPlay: () => void;
}

export function Menu({ onPlay }: MenuProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "24px",
    }}>
      <h1 style={{ fontSize: "48px" }}>⚡ Pikachu Onet Connect</h1>
      <p style={{ fontSize: "18px", color: "#aaa" }}>
        Match pairs of tiles by connecting them with up to 3 lines
      </p>
      <button
        onClick={onPlay}
        style={{
          padding: "16px 48px",
          fontSize: "24px",
          background: "#e94560",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Play
      </button>
    </div>
  );
}
