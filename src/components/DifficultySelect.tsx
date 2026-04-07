import { Difficulty } from "../types";

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void;
  onBack: () => void;
}

const difficulties: { key: Difficulty; label: string; desc: string }[] = [
  { key: "easy", label: "Easy", desc: "6×4 grid • 5 min • 5 hints" },
  { key: "medium", label: "Medium", desc: "8×6 grid • 4 min • 3 hints" },
  { key: "hard", label: "Hard", desc: "10×8 grid • 3 min • 1 hint" },
];

export function DifficultySelect({ onSelect, onBack }: DifficultySelectProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "20px",
    }}>
      <h2 style={{ fontSize: "32px" }}>Select Difficulty</h2>
      <div style={{ display: "flex", gap: "16px" }}>
        {difficulties.map((d) => (
          <button
            key={d.key}
            onClick={() => onSelect(d.key)}
            style={{
              padding: "20px 32px",
              fontSize: "18px",
              background: "#0f3460",
              color: "#fff",
              border: "2px solid #e94560",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <strong>{d.label}</strong>
            <span style={{ fontSize: "12px", color: "#aaa" }}>{d.desc}</span>
          </button>
        ))}
      </div>
      <button
        onClick={onBack}
        style={{
          padding: "8px 24px",
          fontSize: "16px",
          background: "transparent",
          color: "#aaa",
          border: "1px solid #aaa",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Back
      </button>
    </div>
  );
}
