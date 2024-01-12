import * as React from "react";
import { DataEditor, GridCellKind } from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Grid = () => {
  return (
    <>
      <div>Test</div>
      <DataEditor
        width={600}
        height={200}
        columns={[
          { title: "A", width: 100 },
          { title: "B", width: 100 },
          { title: "C", width: 100 },
        ]}
        smoothScrollX={true}
        smoothScrollY={true}
        getCellContent={([col, row]) => {
          return {
            kind: GridCellKind.Text,
            data: "Hello, world!",
            displayData: "Hello, world!",
          };
        }}
        rows={100}
      />
      <div>Test2</div>
    </>
  );
};
