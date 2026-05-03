import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "antd";

import PlatformAttachments from "./index";

describe("PlatformAttachments", () => {
	it("renders attachments title", () => {
		render(
			<App>
				<PlatformAttachments />
			</App>,
		);

		expect(screen.getByText("附件（P0 契约对齐）")).toBeInTheDocument();
	});
});
