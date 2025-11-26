// Shoutout ChatGPT

// ----------------------
// Primitive field types
// ----------------------

export type FieldType =
    | { kind: "u8" }
    | { kind: "u16", endian?: "be" | "le" }
    | { kind: "u32", endian?: "be" | "le" }
    | { kind: "u64", endian?: "be" | "le" }
    | { kind: "f32", endian?: "be" | "le" }
    | { kind: "f64", endian?: "be" | "le" }
    | { kind: "bytes", length: number }
    | { kind: "string", length: number }
    | { kind: "array", length: number, type: FieldType }
    | { kind: "struct", fields: StructField[] }
    | { kind: "union", variants: StructField[] };

export interface StructField {
    name: string;
    type: FieldType;
}

// ----------------------
// Helpers to declare types
// ----------------------

export const u8 = (): FieldType => ({ kind: "u8" });
export const u16 = (endian: "be" | "le" = "be"): FieldType => ({ kind: "u16", endian });
export const u32 = (endian: "be" | "le" = "be"): FieldType => ({ kind: "u32", endian });
export const u64 = (endian: "be" | "le" = "be"): FieldType => ({ kind: "u64", endian });
export const f32 = (endian: "be" | "le" = "be"): FieldType => ({ kind: "f32", endian });
export const f64 = (endian: "be" | "le" = "be"): FieldType => ({ kind: "f64", endian });

export const bytes = (len: number): FieldType => ({ kind: "bytes", length: len });
export const str = (len: number): FieldType => ({ kind: "string", length: len });

export const arr = (length: number, type: FieldType): FieldType => ({
    kind: "array",
    length,
    type
});

export const struct = (fields: StructField[]): FieldType => ({
    kind: "struct",
    fields
});

export const union = (variants: StructField[]): FieldType => ({
    kind: "union",
    variants
});

// ----------------------
// Size calculator
// ----------------------

export function sizeof(type: FieldType): number {
    switch (type.kind) {
        case "u8": return 1;
        case "u16": return 2;
        case "u32": return 4;
        case "u64": return 8;
        case "f32": return 4;
        case "f64": return 8;
        case "bytes": return type.length;
        case "string": return type.length;
        case "array": return type.length * sizeof(type.type);
        case "struct":
            return type.fields.reduce((sum, f) => sum + sizeof(f.type), 0);
        case "union":
            return Math.max(...type.variants.map(v => sizeof(v.type)));
    }
}

// ----------------------
// Encoder
// ----------------------

export function encodeStruct(fields: StructField[], data: any): Buffer {
    const totalSize = fields.reduce((sum, f) => sum + sizeof(f.type), 0);
    const buf = Buffer.alloc(totalSize);
    let offset = 0;

    const writeField = (type: FieldType, value: any) => {
        switch (type.kind) {
            case "u8":
                buf.writeUInt8(value, offset);
                offset += 1;
                break;

            case "u16":
                type.endian === "be"
                    ? buf.writeUInt16BE(value, offset)
                    : buf.writeUInt16LE(value, offset);
                offset += 2;
                break;

            case "u32":
                type.endian === "be"
                    ? buf.writeUInt32BE(value, offset)
                    : buf.writeUInt32LE(value, offset);
                offset += 4;
                break;

            case "u64":
                type.endian === "be"
                    ? buf.writeBigUInt64BE(BigInt(value), offset)
                    : buf.writeBigUInt64LE(BigInt(value), offset);
                offset += 8;
                break;

            case "f32":
                type.endian === "be"
                    ? buf.writeFloatBE(value, offset)
                    : buf.writeFloatLE(value, offset);
                offset += 4;
                break;

            case "f64":
                type.endian === "be"
                    ? buf.writeDoubleBE(value, offset)
                    : buf.writeDoubleLE(value, offset);
                offset += 8;
                break;

            case "bytes": {
                const b = Buffer.from(value);
                b.copy(buf, offset, 0, type.length);
                offset += type.length;
                break;
            }

            case "string": {
                const strBuf = Buffer.from(value, "ascii");
                strBuf.copy(buf, offset, 0, type.length);
                offset += type.length;
                break;
            }

            case "array":
                for (let i = 0; i < type.length; i++)
                    writeField(type.type, value[i]);
                break;

            case "struct":
                encodeStruct(type.fields, value).copy(buf, offset);
                offset += sizeof(type);
                break;

            case "union":
                // write the first provided field variant
                for (const variant of type.variants) {
                    if (variant.name in value) {
                        encodeStruct([variant], value).copy(buf, offset);
                        offset += sizeof(type);
                        return;
                    }
                }
                throw new Error("Union: no matching field provided");
        }
    };

    for (const field of fields)
        writeField(field.type, data[field.name]);

    return buf;
}

export function sizeofStruct(fields: StructField[]): number {
    return fields.reduce((sum, f) => sum + sizeof(f.type), 0);
}

// ----------------------
// Decoder
// ----------------------

export function decodeStruct(fields: StructField[], buffer: Buffer, offset = 0): any {
    const result: any = {};

    const readField = (type: FieldType): any => {
        let value: any;

        switch (type.kind) {
            case "u8":
                value = buffer.readUInt8(offset);
                offset += 1;
                return value;

            case "u16":
                value = type.endian === "be"
                    ? buffer.readUInt16BE(offset)
                    : buffer.readUInt16LE(offset);
                offset += 2;
                return value;

            case "u32":
                value = type.endian === "be"
                    ? buffer.readUInt32BE(offset)
                    : buffer.readUInt32LE(offset);
                offset += 4;
                return value;

            case "u64":
                value = type.endian === "be"
                    ? buffer.readBigUInt64BE(offset)
                    : buffer.readBigUInt64LE(offset);
                offset += 8;
                return value;

            case "f32":
                value = type.endian === "be"
                    ? buffer.readFloatBE(offset)
                    : buffer.readFloatLE(offset);
                offset += 4;
                return value;

            case "f64":
                value = type.endian === "be"
                    ? buffer.readDoubleBE(offset)
                    : buffer.readDoubleLE(offset);
                offset += 8;
                return value;

            case "bytes":
                value = buffer.subarray(offset, offset + type.length);
                offset += type.length;
                return value;

            case "string":
                value = buffer.toString("ascii", offset, offset + type.length);
                offset += type.length;
                return value;

            case "array": {
                const arrVal = [];
                for (let i = 0; i < type.length; i++) {
                    arrVal.push(readField(type.type));
                }
                return arrVal;
            }

            case "struct": {
                const structVal = decodeStruct(type.fields, buffer, offset);
                offset += sizeof(type);
                return structVal;
            }

            case "union": {
                // Try decoding each variant, but do NOT advance global offset until chosen
                for (const variant of type.variants) {
                    const localOffset = offset;
                    try {
                        const decoded = decodeStruct([variant], buffer, localOffset);
                        offset += sizeof(type);
                        return decoded;
                    } catch {
                        continue;
                    }
                }
                throw new Error("Union: could not decode any variant");
            }
        }
    };

    for (const field of fields) {
        result[field.name] = readField(field.type);
    }

    return result;
}
