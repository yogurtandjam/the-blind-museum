type LobbyProps = {
  onEnterMuseum: () => void;
  onSearch: () => void;
};

export function Lobby({ onEnterMuseum, onSearch }: LobbyProps) {
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
      </div>
    </div>
  );
}
