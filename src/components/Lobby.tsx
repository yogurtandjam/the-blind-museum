import { useState } from "react";
import { getApiKey, setApiKey } from "../audio/tts";

type LobbyProps = {
  onEnterMuseum: () => void;
  onSearch: () => void;
};

export function Lobby({ onEnterMuseum, onSearch }: LobbyProps) {
  const [apiKey, setApiKeyState] = useState(getApiKey() || "");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      setApiKey(apiKey.trim());
    }
    setShowKeyInput(false);
  };

  const hasKey = !!getApiKey();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        color: "#e0e0e0",
        padding: "2rem",
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#e0e0e0",
          marginBottom: "1rem",
          fontWeight: 300,
        }}
      >
        The Blind Museum
      </h1>

      <p
        style={{
          color: "#888",
          maxWidth: "400px",
          textAlign: "center",
          lineHeight: 1.6,
          marginBottom: "1rem",
        }}
      >
        A museum you experience with your eyes closed.
      </p>

      <p
        style={{
          color: "#666",
          maxWidth: "400px",
          textAlign: "center",
          lineHeight: 1.8,
          fontSize: "0.9rem",
          marginBottom: "3rem",
        }}
      >
        &larr; &rarr; Walk between artworks
        <br />
        &uarr; &darr; Move between wings
        <br />
        Close your eyes to experience each piece
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "280px",
          alignItems: "center",
        }}
      >
        <button
          onClick={onEnterMuseum}
          style={{
            width: "100%",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#e0e0e0",
            color: "#0a0a0a",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Enter the Museum
        </button>
        <button
          onClick={onSearch}
          style={{
            width: "100%",
            padding: "0.75rem 1.5rem",
            backgroundColor: "transparent",
            color: "#666",
            border: "none",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Search
        </button>

        <div style={{ marginTop: "2rem", width: "100%" }}>
          {!showKeyInput ? (
            <p
              onClick={() => setShowKeyInput(true)}
              style={{
                color: "#555",
                cursor: "pointer",
                textAlign: "center",
                fontSize: "0.85rem",
              }}
            >
              {hasKey ? "OpenAI voice active \u2713" : "Add OpenAI key for AI voice"}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <input
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                placeholder="sk-..."
                type="password"
                style={{
                  padding: "0.5rem",
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  color: "#e0e0e0",
                  fontSize: "0.9rem",
                }}
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={handleSaveKey}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    backgroundColor: "#333",
                    color: "#e0e0e0",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setShowKeyInput(false)}
                  style={{
                    padding: "0.5rem",
                    backgroundColor: "transparent",
                    color: "#555",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
              <p style={{ color: "#444", fontSize: "0.75rem" }}>
                Stored locally. Without a key, browser voice is used as fallback.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
