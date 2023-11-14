import React from "react";
import { Client as Styletron } from "styletron-engine-atomic";
import { Provider as StyletronProvider } from "styletron-react";
import { LightTheme, BaseProvider } from "baseui";

const engine = new Styletron();

type Props = {
  children: React.ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <StyletronProvider value={engine}>
      <BaseProvider theme={LightTheme}>{children}</BaseProvider>
    </StyletronProvider>
  );
}
