const counters: Record<string, number> = {};

/**
 * Retrieves an API key from a comma-separated string of keys using Round Robin rotation.
 */
export function getRandomApiKey(envVarName: string = 'NVIDIA_API_KEY'): string {
  const keysString = process.env[envVarName] || '';
  const keys = keysString.split(',').map(key => key.trim()).filter(Boolean);
  
  if (keys.length === 0) {
    return '';
  }
  
  if (keys.length === 1) {
    return keys[0];
  }

  // Round Robin rotation
  if (counters[envVarName] === undefined) {
    counters[envVarName] = 0;
  }
  
  const key = keys[counters[envVarName] % keys.length];
  counters[envVarName] = (counters[envVarName] + 1) % keys.length;
  
  return key;
}
