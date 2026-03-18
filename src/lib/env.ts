export function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getEnvOrDefault(name: string, fallback: string) {
  return process.env[name] || fallback;
}
