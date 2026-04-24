const getCrypto = () => {
  const cryptoObject = globalThis.crypto;

  if (!cryptoObject || typeof cryptoObject.getRandomValues !== "function") {
    throw new Error("Secure random source unavailable.");
  }

  return cryptoObject;
};

const randomUint32 = () => {
  const values = new Uint32Array(1);
  getCrypto().getRandomValues(values);
  return values[0] ?? 0;
};

export const randomFraction = () => randomUint32() / 0x1_0000_0000;

export const randomInRange = (min: number, max: number) => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    throw new Error("Invalid secure random range.");
  }

  return min + randomFraction() * (max - min);
};

export const randomInt = (minInclusive: number, maxExclusive: number) => {
  if (!Number.isInteger(minInclusive) || !Number.isInteger(maxExclusive) || maxExclusive <= minInclusive) {
    throw new Error("Invalid secure random integer range.");
  }

  return minInclusive + Math.floor(randomFraction() * (maxExclusive - minInclusive));
};

export const randomBool = (probability: number) => {
  if (probability <= 0) {
    return false;
  }

  if (probability >= 1) {
    return true;
  }

  return randomFraction() < probability;
};

export const createOpaqueId = (prefix = "") => {
  const bytes = new Uint8Array(12);
  getCrypto().getRandomValues(bytes);
  const encoded = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `${prefix}${encoded}`;
};
