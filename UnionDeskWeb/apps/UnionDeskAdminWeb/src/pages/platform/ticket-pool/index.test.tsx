import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "antd";

import PlatformTicketPool from "./index";

describe("PlatformTicketPool", () => {
	it("renders ticket pool title", () => {
		render(
			<App>
				<PlatformTicketPool />
			</App>,
		);

		expect(screen.getByText("工单池（P0）")).toBeInTheDocument();
	});
});
