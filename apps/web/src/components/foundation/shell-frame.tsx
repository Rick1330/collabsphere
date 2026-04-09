import * as React from "react";

import {
  ShellFrameView,
  type ShellFrameProps,
} from "./shell-frame-view";

export function ShellFrame(props: ShellFrameProps) {
  return <ShellFrameView {...props} />;
}
