window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-voice-input",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		//#region src/client/VoiceInputButton.tsx
		/**
		* Voice input button: records 16 kHz mono PCM through getUserMedia, encodes to
		* WAV base64, streams re-transcriptions of the growing buffer to the composer
		* draft, and punctuates on stop via the voiceInput Remote.
		*/
		function joinText(base, text) {
			const t = (text || "").trim();
			if (!t) return base || "";
			if (!base) return t;
			return base + " " + t;
		}
		function MicIcon() {
			return react.default.createElement("svg", {
				viewBox: "0 0 24 24",
				width: 16,
				height: 16,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 2,
				strokeLinecap: "round",
				strokeLinejoin: "round"
			}, react.default.createElement("rect", {
				x: 9,
				y: 2,
				width: 6,
				height: 12,
				rx: 3
			}), react.default.createElement("path", { d: "M5 10v1a7 7 0 0 0 14 0v-1" }), react.default.createElement("line", {
				x1: 12,
				y1: 18,
				x2: 12,
				y2: 22
			}));
		}
		/** Encode a Float32Array as base64 (raw PCM bytes, no WAV header). */
		function float32ToBase64(samples) {
			const bytes = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
			const chunk = 32768;
			let binary = "";
			for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
			const g = typeof globalThis !== "undefined" ? globalThis : window;
			const b64 = typeof btoa === "function" ? btoa : g && typeof g.btoa === "function" ? g.btoa : void 0;
			if (b64) return b64(binary);
			const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
			let out = "";
			for (let i = 0; i < bytes.length; i += 3) {
				const b1 = bytes[i];
				const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
				const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
				out += chars[b1 >> 2];
				out += chars[(b1 & 3) << 4 | b2 >> 4];
				out += i + 1 < bytes.length ? chars[(b2 & 15) << 2 | b3 >> 6] : "=";
				out += i + 2 < bytes.length ? chars[b3 & 63] : "=";
			}
			return out;
		}
		/** Linear-interpolation resample to 16 kHz (the model's expected rate). */
		function resampleTo16k(samples, fromRate) {
			if (fromRate === 16e3) return samples;
			const ratio = 16e3 / fromRate;
			const newLen = Math.round(samples.length * ratio);
			const out = new Float32Array(newLen);
			for (let i = 0; i < newLen; i++) {
				const srcIdx = i / ratio;
				const lo = Math.floor(srcIdx);
				const hi = Math.min(lo + 1, samples.length - 1);
				const frac = srcIdx - lo;
				out[i] = samples[lo] * (1 - frac) + samples[hi] * frac;
			}
			return out;
		}
		/** Check if samples are effectively silent (all near-zero). */
		function isSilent(samples) {
			let max = 0;
			for (let i = 0; i < samples.length; i++) {
				const a = Math.abs(samples[i]);
				if (a > max) max = a;
			}
			return max < .001;
		}
		const VOICE_CSS = `
.dsh-voice-wrap { display: inline-flex; align-items: center; gap: 6px; }
.dsh-voice-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; margin: 0; padding: 0;
  border: none; border-radius: 999px; background: transparent;
  color: currentColor; opacity: 0.85; cursor: pointer; flex-shrink: 0;
  transition: opacity 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}
.dsh-voice-btn:hover { opacity: 1; background-color: rgba(128, 128, 128, 0.14); }
.dsh-voice-btn:disabled { cursor: default; }
.dsh-voice-btn.is-listening {
  color: #ef4444; opacity: 1; background-color: rgba(239, 68, 68, 0.14);
  animation: dsh-voice-pulse 1.4s ease-in-out infinite;
}
.dsh-voice-btn.is-busy { color: #f59e0b; opacity: 1; animation: dsh-voice-busy 1s ease-in-out infinite; }
.dsh-voice-btn.is-error { color: #ef4444; opacity: 1; }
@keyframes dsh-voice-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.45); }
  50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
}
@keyframes dsh-voice-busy { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.dsh-voice-error {
  font-size: 11px; line-height: 1.2; color: #ef4444; white-space: nowrap;
  max-width: 220px; overflow: hidden; text-overflow: ellipsis;
}
`;
		const TICKS = 3;
		function VoiceInputButton(props) {
			const draft = props.useInput ? props.useInput((s) => s.draft) : "";
			const [status, setStatus] = react.default.useState("idle");
			const [errorText, setErrorText] = react.default.useState("");
			const recRef = react.default.useRef(null);
			const baseDraftRef = react.default.useRef("");
			const draftRef = react.default.useRef("");
			draftRef.current = draft;
			const setDraft = (text) => {
				if (props.inputActions && typeof props.inputActions.setDraft === "function") props.inputActions.setDraft(text);
			};
			const concatSamples = (rec) => {
				let total = 0;
				for (const chunk of rec.chunks) total += chunk.length;
				if (total === 0) return null;
				const samples = new Float32Array(total);
				let off = 0;
				for (const chunk of rec.chunks) {
					samples.set(chunk, off);
					off += chunk.length;
				}
				return samples;
			};
			const transcribe = async (rec, final) => {
				const raw = concatSamples(rec);
				if (!raw) return "";
				if (!props.remote || typeof props.remote.transcribe !== "function") return "";
				const samples = resampleTo16k(raw, rec.sampleRate || 16e3);
				if (isSilent(samples)) return "";
				const b64 = float32ToBase64(samples);
				const answered = await props.remote.transcribe({
					b64,
					final
				});
				return answered.ok && typeof answered.value.text === "string" ? answered.value.text : "";
			};
			const teardownAudio = (rec) => {
				if (rec.processor) {
					rec.processor.onaudioprocess = null;
					try {
						rec.processor.disconnect();
					} catch {}
				}
				if (rec.sourceNode) try {
					rec.sourceNode.disconnect();
				} catch {}
				if (rec.stream) try {
					rec.stream.getTracks().forEach((t) => t.stop());
				} catch {}
				if (rec.audioCtx) try {
					rec.audioCtx.close();
				} catch {}
			};
			react.default.useEffect(() => () => {
				const rec = recRef.current;
				if (rec) {
					rec.stopping = true;
					teardownAudio(rec);
				}
			}, []);
			const start = async () => {
				const g = typeof globalThis !== "undefined" ? globalThis : window;
				if (!g || !g.navigator || !g.navigator.mediaDevices || !g.navigator.mediaDevices.getUserMedia) {
					setErrorText("当前环境不支持麦克风录音");
					setStatus("error");
					return;
				}
				try {
					const stream = await g.navigator.mediaDevices.getUserMedia({ audio: {
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true
					} });
					const AC = g.AudioContext || g.webkitAudioContext;
					if (!AC) {
						stream.getTracks().forEach((t) => t.stop());
						setErrorText("当前浏览器不支持音频采集");
						setStatus("error");
						return;
					}
					const audioCtx = new AC({ sampleRate: 16e3 });
					if (typeof audioCtx.resume === "function") try {
						await audioCtx.resume();
					} catch {}
					const sourceNode = audioCtx.createMediaStreamSource(stream);
					const processor = audioCtx.createScriptProcessor(4096, 1, 1);
					const rec = {
						stream,
						audioCtx,
						sourceNode,
						processor,
						chunks: [],
						sampleRate: audioCtx.sampleRate,
						tick: 0,
						transcribing: false,
						stopping: false,
						inFlight: null
					};
					recRef.current = rec;
					processor.onaudioprocess = (e) => {
						const input = e.inputBuffer.getChannelData(0);
						rec.chunks.push(new Float32Array(input));
						rec.tick++;
						if (rec.tick >= TICKS && !rec.transcribing && !rec.stopping) {
							rec.tick = 0;
							rec.transcribing = true;
							rec.inFlight = transcribe(rec, false).then((text) => {
								if (text && !rec.stopping) setDraft(joinText(baseDraftRef.current, text));
							}).catch(() => {}).finally(() => {
								rec.transcribing = false;
							});
						}
					};
					const gain = audioCtx.createGain();
					gain.gain.value = 0;
					sourceNode.connect(processor);
					processor.connect(gain);
					gain.connect(audioCtx.destination);
					baseDraftRef.current = draftRef.current;
					setErrorText("");
					setStatus("recording");
				} catch (e) {
					const name = e && e.name || "";
					if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") setErrorText("麦克风权限被拒绝，请允许麦克风后重试");
					else if (name === "NotFoundError" || name === "DevicesNotFoundError") setErrorText("找不到可用的麦克风设备");
					else setErrorText("无法启动录音: " + (e && e.message || String(e)));
					setStatus("error");
				}
			};
			const stop = async () => {
				const rec = recRef.current;
				if (!rec) return;
				recRef.current = null;
				rec.stopping = true;
				teardownAudio(rec);
				setStatus("transcribing");
				setErrorText("");
				try {
					if (rec.inFlight) try {
						await rec.inFlight;
					} catch {}
					const raw = concatSamples(rec);
					if (!raw || isSilent(resampleTo16k(raw, rec.sampleRate || 16e3))) {
						setStatus("error");
						setErrorText("麦克风没有收到声音，请检查麦克风是否正常");
						return;
					}
					const text = await transcribe(rec, true);
					if (text) {
						setDraft(joinText(baseDraftRef.current, text));
						setStatus("idle");
						setErrorText("");
					} else {
						setStatus("error");
						setErrorText("没有识别到文字，请重试");
					}
				} catch (e) {
					setStatus("error");
					setErrorText("转写失败: " + (e && e.message || String(e)));
				}
			};
			const toggle = () => {
				if (status === "recording") stop();
				else if (status !== "transcribing") start();
			};
			const listening = status === "recording";
			const busy = status === "transcribing";
			const title = listening ? "正在录音… 点击停止" : busy ? "正在转写…" : errorText || "语音输入";
			return react.default.createElement(react.default.Fragment, null, react.default.createElement("style", null, VOICE_CSS), react.default.createElement("span", { className: "dsh-voice-wrap" }, react.default.createElement("button", {
				className: "dsh-voice-btn" + (listening ? " is-listening" : "") + (busy ? " is-busy" : "") + (status === "error" ? " is-error" : ""),
				type: "button",
				onClick: toggle,
				disabled: busy,
				title,
				"aria-label": listening ? "停止语音输入" : "开始语音输入",
				"aria-pressed": listening ? "true" : "false"
			}, react.default.createElement(MicIcon)), errorText ? react.default.createElement("span", { className: "dsh-voice-error" }, errorText) : null));
		}
		//#endregion
		//#region src/client/index.ts
		/** Required services: the slot registry and the mounted voiceInput Remote namespace. */
		const inject = [
			"slots",
			"remote",
			"remote.voiceInput"
		];
		/**
		* Client plugin body: register the mic button into the composer's right tool
		* row once the slot declarer and the voiceInput Remote are both ready.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.slots.inject("conversation.input.right", () => {
				return ctx.slots.register({
					name: "conversation.input.right",
					id: "voice-input",
					order: 100,
					label: "语音输入",
					inject: () => ({ remote: ctx.remote.voiceInput })
				}, VoiceInputButton);
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map