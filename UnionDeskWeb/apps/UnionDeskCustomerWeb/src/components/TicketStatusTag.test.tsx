import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TicketStatusTag from "./TicketStatusTag";

describe("TicketStatusTag", () => {
  it("renders a readable label for a ticket status", () => {
    render(<TicketStatusTag status="processing" />);

    expect(screen.getByText("处理中")).toBeInTheDocument();
  });
});

