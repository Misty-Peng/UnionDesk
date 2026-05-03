import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { App } from "antd";

import StepUpModal from "./index";

describe("StepUpModal", () => {
	it("renders step-up copy and password field", () => {
		const onCancel = vi.fn();
		const onVerified = vi.fn();
		render(
			<App>
				<StepUpModal open onCancel={onCancel} onVerified={onVerified} />
			</App>,
		);

		expect(screen.getByText("二次验证")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("请输入密码")).toBeInTheDocument();
	});
});
