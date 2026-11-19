import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Common fields shared by all emsg box versions (ISO/IEC 23009-1:2022 - 5.10.3.3).
 *
 * @public
 */
export type EventMessageBoxBase = FullBox & {
	type: 'emsg'
	/** The URI that identifies the message scheme. The box stores a null-terminated UTF-8 string. */
	schemeIdUri: string
	/** The value of the event. The box stores a null-terminated UTF-8 string. */
	value: string
	timescale: number
	eventDuration: number
	id: number
	/** The message bytes. The bytes are a view over the input buffer. */
	messageData: Uint8Array
}

/**
 * A parsed emsg (Event Message) box, version 0 (ISO/IEC 23009-1:2022 - 5.10.3.3).
 *
 * @public
 */
export type EventMessageBoxV0 = EventMessageBoxBase & {
	version: 0
	presentationTimeDelta: number
}

/**
 * A parsed emsg (Event Message) box, version 1 (ISO/IEC 23009-1:2022 - 5.10.3.3).
 *
 * Version 1 uses a 64-bit absolute presentation time instead of a delta.
 *
 * @public
 */
export type EventMessageBoxV1<V extends IsoInt64 = number> = EventMessageBoxBase & {
	version: 1
	presentationTime: V
}

/**
 * The values of the `version` field of an emsg box other than 0 or 1. The field has 8 bits, so the values are 2 to 255.
 *
 * @public
 */
// prettier-ignore
export type EventMessageBoxUnrecognizedVersionNumber =
	| 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17
	| 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33
	| 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49
	| 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63 | 64 | 65
	| 66 | 67 | 68 | 69 | 70 | 71 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79 | 80 | 81
	| 82 | 83 | 84 | 85 | 86 | 87 | 88 | 89 | 90 | 91 | 92 | 93 | 94 | 95 | 96 | 97
	| 98 | 99 | 100 | 101 | 102 | 103 | 104 | 105 | 106 | 107 | 108 | 109 | 110 | 111 | 112 | 113
	| 114 | 115 | 116 | 117 | 118 | 119 | 120 | 121 | 122 | 123 | 124 | 125 | 126 | 127 | 128 | 129
	| 130 | 131 | 132 | 133 | 134 | 135 | 136 | 137 | 138 | 139 | 140 | 141 | 142 | 143 | 144 | 145
	| 146 | 147 | 148 | 149 | 150 | 151 | 152 | 153 | 154 | 155 | 156 | 157 | 158 | 159 | 160 | 161
	| 162 | 163 | 164 | 165 | 166 | 167 | 168 | 169 | 170 | 171 | 172 | 173 | 174 | 175 | 176 | 177
	| 178 | 179 | 180 | 181 | 182 | 183 | 184 | 185 | 186 | 187 | 188 | 189 | 190 | 191 | 192 | 193
	| 194 | 195 | 196 | 197 | 198 | 199 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 209
	| 210 | 211 | 212 | 213 | 214 | 215 | 216 | 217 | 218 | 219 | 220 | 221 | 222 | 223 | 224 | 225
	| 226 | 227 | 228 | 229 | 230 | 231 | 232 | 233 | 234 | 235 | 236 | 237 | 238 | 239 | 240 | 241
	| 242 | 243 | 244 | 245 | 246 | 247 | 248 | 249 | 250 | 251 | 252 | 253 | 254 | 255

/**
 * A parsed emsg (Event Message) box of a version other than 0 or 1 (ISO/IEC 23009-1:2022 - 5.10.3.3).
 *
 * The syntax defines no fields for such a version except `message_data`.
 * `messageData` holds all bytes after the full box fields.
 * The strings are empty and the numbers are 0.
 *
 * @public
 */
export type EventMessageBoxUnrecognizedVersion<V extends IsoInt64 = number> =
	EventMessageBoxBase & {
		version: EventMessageBoxUnrecognizedVersionNumber
		presentationTimeDelta: number
		presentationTime: V
	}

/**
 * Event Message Box (`emsg`).
 *
 * ISO/IEC 23009-1:2022 - 5.10.3.3
 *
 * Use the `version` discriminant to access version-specific fields
 * ({@link EventMessageBoxV0} or {@link EventMessageBoxV1}).
 *
 * @public
 */
export type EventMessageBox<V extends IsoInt64 = number> =
	| EventMessageBoxV0
	| EventMessageBoxV1<V>
	| EventMessageBoxUnrecognizedVersion<V>
