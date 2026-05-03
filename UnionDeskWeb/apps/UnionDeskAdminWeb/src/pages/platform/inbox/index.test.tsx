import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "antd";

import PlatformInbox from "./index";

describe("PlatformInbox", () => {
	it("renders inbox title", () => {
		render(
			<App>
				<PlatformInbox />
			</App>,
		);

		expect(screen.getByText("通知中心 · 站内信（P0）")).toBeInTheDocument();
	});
});
