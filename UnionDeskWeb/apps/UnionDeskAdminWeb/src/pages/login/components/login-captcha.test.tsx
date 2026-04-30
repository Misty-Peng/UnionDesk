import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { LoginCaptcha } from "./login-captcha";

vi.mock("@uniondesk/shared", () => ({
	SliderCaptcha: (props: { disabled?: boolean }) => (
		<div
			data-testid="slider-captcha"
			data-disabled={String(Boolean(props.disabled))}
		/>
	),
}));

describe("LoginCaptcha", () => {
	it("renders slider captcha when enabled", () => {
		render(
			<LoginCaptcha
				enabled
				hint="请按住滑块，拖动到最右边"
				disabled={false}
				onVerified={() => {}}
				onError={() => {}}
			/>,
		);

		expect(screen.getByTestId("slider-captcha")).toBeInTheDocument();
		expect(screen.getByText("请按住滑块，拖动到最右边")).toBeInTheDocument();
	});

	it("hides slider captcha when disabled", () => {
		render(
			<LoginCaptcha
				enabled={false}
				onVerified={() => {}}
				onError={() => {}}
			/>,
		);

		expect(screen.queryByTestId("slider-captcha")).not.toBeInTheDocument();
	});
});
