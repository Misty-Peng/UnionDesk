import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "antd";

import PlatformDomainOnboarding from "./index";

describe("PlatformDomainOnboarding", () => {
	it("renders onboarding alert", () => {
		render(
			<App>
				<PlatformDomainOnboarding />
			</App>,
		);

		expect(screen.getByText("客户入域（P0）")).toBeInTheDocument();
	});
});
