import { useState } from "react";
import { useStyletron } from "baseui";
import { HeadingXSmall, ParagraphMedium, ParagraphSmall } from "baseui/typography";
import { Button } from "baseui/button";
import { Input } from "baseui/input";
import { getApiKey, setApiKey } from "../audio/tts";

type LobbyProps = {
  onEnterMuseum: () => void;
  onSearch: () => void;
};

export function Lobby({ onEnterMuseum, onSearch }: LobbyProps) {
  const [css] = useStyletron();
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
      className={css({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        color: "#e0e0e0",
        padding: "2rem",
      })}
    >
      <HeadingXSmall
        color="#e0e0e0"
        marginBottom="1rem"
        overrides={{
          Block: {
            style: {
              fontSize: "2rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase" as const,
            },
          },
        }}
      >
        The Blind Museum
      </HeadingXSmall>

      <ParagraphMedium
        color="#888"
        marginBottom="3rem"
        overrides={{
          Block: {
            style: {
              maxWidth: "400px",
              textAlign: "center" as const,
              lineHeight: "1.6",
            },
          },
        }}
      >
        A museum you experience with your eyes closed.
      </ParagraphMedium>

      <ParagraphSmall
        color="#666"
        marginBottom="3rem"
        overrides={{
          Block: {
            style: {
              maxWidth: "400px",
              textAlign: "center" as const,
              lineHeight: "1.8",
            },
          },
        }}
      >
        &larr; &rarr; Walk between artworks
        <br />
        &uarr; &darr; Move between wings
        <br />
        Close your eyes to experience each piece
      </ParagraphSmall>

      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "280px",
          alignItems: "center",
        })}
      >
        <Button
          onClick={onEnterMuseum}
          overrides={{
            BaseButton: {
              style: {
                width: "100%",
                backgroundColor: "#e0e0e0",
                color: "#0a0a0a",
                ":hover": { backgroundColor: "#ffffff" },
              },
            },
          }}
        >
          Enter the Museum
        </Button>
        <Button
          onClick={onSearch}
          kind="tertiary"
          overrides={{
            BaseButton: {
              style: {
                width: "100%",
                color: "#666",
                ":hover": { color: "#e0e0e0" },
              },
            },
          }}
        >
          Search
        </Button>

        {/* API key section */}
        <div className={css({ marginTop: "2rem", width: "100%" })}>
          {!showKeyInput ? (
            <ParagraphSmall
              color="#555"
              overrides={{
                Block: {
                  style: {
                    cursor: "pointer",
                    textAlign: "center" as const,
                    ":hover": { color: "#888" },
                  },
                  props: { onClick: () => setShowKeyInput(true) },
                },
              }}
            >
              {hasKey ? "OpenAI voice active \u2713" : "Add OpenAI key for AI voice"}
            </ParagraphSmall>
          ) : (
            <div className={css({ display: "flex", flexDirection: "column", gap: "0.5rem" })}>
              <Input
                value={apiKey}
                onChange={(e) => setApiKeyState(e.currentTarget.value)}
                placeholder="sk-..."
                type="password"
                overrides={{
                  Root: {
                    style: {
                      backgroundColor: "#1a1a1a",
                      borderColor: "#333",
                    },
                  },
                  Input: {
                    style: {
                      color: "#e0e0e0",
                      backgroundColor: "#1a1a1a",
                    },
                  },
                }}
              />
              <div className={css({ display: "flex", gap: "0.5rem" })}>
                <Button
                  onClick={handleSaveKey}
                  size="compact"
                  overrides={{
                    BaseButton: {
                      style: {
                        flex: 1,
                        backgroundColor: "#333",
                        color: "#e0e0e0",
                        ":hover": { backgroundColor: "#444" },
                      },
                    },
                  }}
                >
                  Save
                </Button>
                <Button
                  onClick={() => setShowKeyInput(false)}
                  size="compact"
                  kind="tertiary"
                  overrides={{
                    BaseButton: {
                      style: {
                        color: "#555",
                        ":hover": { color: "#888" },
                      },
                    },
                  }}
                >
                  Cancel
                </Button>
              </div>
              <ParagraphSmall color="#444" overrides={{ Block: { style: { fontSize: "0.75rem" } } }}>
                Stored locally. Without a key, browser voice is used as fallback.
              </ParagraphSmall>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
