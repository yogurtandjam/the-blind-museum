type ImageProps = {
  src: string;
};
export default (props: ImageProps) => {
  return (
    <div>
      <img
        src={props.src}
        style={{
          height: "500px",
        }}
      />
    </div>
  );
};
