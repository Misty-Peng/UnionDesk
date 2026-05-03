import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "antd";

import PlatformBusinessDomains from "./index";

describe("PlatformBusinessDomains", () => {
	it("renders P0 domain management title", () => {
		render(
			<App>
				<PlatformBusinessDomains />
			</App>,
		);

		expect(screen.getByText("业务域管理（P0）")).toBeInTheDocument();
		expect(screen.getByText("接口对齐说明")).toBeInTheDocument();
	});
});
