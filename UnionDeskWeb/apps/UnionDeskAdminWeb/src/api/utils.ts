type ApiEnvelope<T> = {
	success?: boolean
	code?: number | string
	message?: string
	data?: T
	result?: T
};

function isFailureEnvelope(envelope: ApiEnvelope<unknown>) {
	if (envelope.success === false) {
		return true;
	}
	if (typeof envelope.code === "number") {
		return envelope.code !== 0;
	}
	if (typeof envelope.code === "string") {
		const normalizedCode = envelope.code.trim().toUpperCase();
		if (!normalizedCode) {
			return false;
		}
		return !["0", "OK", "SUCCESS"].includes(normalizedCode);
	}
	return false;
}

export function parseApiResponse<T>(payload: unknown): T {
	if (payload && typeof payload === "object") {
		const envelope = payload as ApiEnvelope<T>;
		const hasEnvelopeShape = "success" in envelope || "code" in envelope || "data" in envelope || "result" in envelope;
		if (hasEnvelopeShape) {
			if (isFailureEnvelope(envelope)) {
				throw new Error(envelope.message?.trim() || "请求失败");
			}
			if ("data" in envelope && envelope.data !== undefined) {
				return envelope.data as T;
			}
			if ("result" in envelope && envelope.result !== undefined) {
				return envelope.result as T;
			}
		}
	}
	return payload as T;
}
