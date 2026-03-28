type ImageProps = {
  src: string;
};

export default function ArtImage({ src }: ImageProps) {
  return (
    <div style={{ marginTop: "1rem", textAlign: "center" }}>
      <img
        src={src}
        alt=""
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      />
    </div>
  );
}
