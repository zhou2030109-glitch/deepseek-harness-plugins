import { createRequire } from "node:module";
import { Service } from "@deepseek-ai/cordis";
import s from "@deepseek-ai/schemastery";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
//#region lib/types/index.js
/**
* Local offline voice-to-text: the Host Remote the browser half calls to
* transcribe recorded audio (sherpa-onnx SenseVoice) and, on the final
* segment, punctuate it (CT-Transformer). Models load ONCE at service init
* via the sherpa-onnx-node native addon — no process spawn, no temp files.
* @module @deepseek-ai/dsh-voice-input
*/
var __runInitializers = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) if (kind === "field") initializers.unshift(_);
		else descriptor[key] = _;
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
const require = createRequire(import.meta.url);
/** Lazily load the native addon (deferred so the schema/build doesn't need it). */
function loadAddon() {
	return require("sherpa-onnx-node");
}
/** Validate the deployment-varying path set at the configuration boundary. */
function normalizeConfig(config) {
	return {
		sttModel: requirePath(config.sttModel, "sttModel"),
		sttTokens: requirePath(config.sttTokens, "sttTokens"),
		punctModel: config.punctModel ?? "",
		numThreads: config.numThreads ?? 1
	};
}
function requirePath(value, field) {
	if (typeof value !== "string" || value.length === 0) throw new TypeError(`voice-input: config.${field} is required`);
	return value;
}
/** Remote-only service exposing the local voice transcription capability. */
let VoiceInputGateway = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _transcribe_decorators;
	return class VoiceInputGateway extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_transcribe_decorators = [Remote("transcribe")];
			__esDecorate(this, null, _transcribe_decorators, {
				kind: "method",
				name: "transcribe",
				static: false,
				private: false,
				access: {
					has: (obj) => "transcribe" in obj,
					get: (obj) => obj.transcribe
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		static inject = [];
		/** Schemastery config schema: the Loader validates and fills defaults before construction. */
		static Config = s.object({
			sttModel: s.string().required(),
			sttTokens: s.string().required(),
			punctModel: s.string().default(""),
			numThreads: s.number().step(1).min(1).default(1)
		});
		cfg = __runInitializers(this, _instanceExtraInitializers);
		recognizer;
		punctuator;
		constructor(ctx, config) {
			super(ctx, "voiceInput");
			this.cfg = normalizeConfig(config);
		}
		/** Load models once at service init (async, non-blocking). */
		async [Service.init]() {
			const { OfflineRecognizer, OfflinePunctuation } = loadAddon();
			this.recognizer = await OfflineRecognizer.createAsync({ modelConfig: {
				senseVoice: {
					model: this.cfg.sttModel,
					useInverseTextNormalization: 1
				},
				tokens: this.cfg.sttTokens,
				numThreads: this.cfg.numThreads
			} });
			if (this.cfg.punctModel) this.punctuator = new OfflinePunctuation({ model: {
				ctTransformer: this.cfg.punctModel,
				numThreads: this.cfg.numThreads
			} });
		}
		/**
		* Transcribe a Float32Array of 16 kHz mono PCM samples (sent as base64).
		* Uses the in-memory recognizer — no process spawn, no temp files.
		* On the final segment, adds punctuation if a punctuator is configured.
		*/
		async transcribe(request) {
			if (!this.recognizer) return {
				text: "",
				error: "语音模型未加载"
			};
			const b64 = typeof request?.b64 === "string" ? request.b64 : "";
			const isFinal = Boolean(request?.final);
			if (!b64) return {
				text: "",
				error: "没有收到音频数据"
			};
			const bytes = Buffer.from(b64, "base64");
			if (bytes.length < 4) return {
				text: "",
				error: "音频数据太短"
			};
			const samples = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
			const stream = this.recognizer.createStream();
			stream.acceptWaveform({
				samples,
				sampleRate: 16e3
			});
			let text = ((await this.recognizer.decodeAsync(stream))?.text ?? "").trim();
			if (!text) return {
				text: "",
				error: isFinal ? "没有识别到文字" : ""
			};
			if (isFinal && this.punctuator) try {
				const punctuated = this.punctuator.addPunct(text).trim();
				if (punctuated) text = punctuated;
			} catch {}
			return { text };
		}
	};
})();
//#endregion
export { VoiceInputGateway, VoiceInputGateway as default };
