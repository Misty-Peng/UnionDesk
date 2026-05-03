import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PlatformImportExport from "./index";

describe("PlatformImportExport", () => {
	it("renders import export skeleton sections", () => {
		render(<PlatformImportExport />);

		expect(screen.getByText("导入导出中心")).toBeInTheDocument();
		expect(screen.getByText("模板下载")).toBeInTheDocument();
		expect(screen.getAllByText("用户导入").length).toBeGreaterThan(0);
		expect(screen.getByText("最近任务")).toBeInTheDocument();
	});
});
