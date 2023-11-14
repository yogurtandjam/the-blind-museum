import { useStyletron } from "baseui";

type ImageProps = {
  src: string;
};
export default (props: ImageProps) => {
  const [css, theme] = useStyletron();
  return (
    <div
      className={css({
        marginTop: theme.sizing.scale650,
      })}
    >
      <img
        src={props.src}
        className={css({
          maxWidth: "100%",
          maxHeight: "100%",
        })}
      />
    </div>
  );
};
