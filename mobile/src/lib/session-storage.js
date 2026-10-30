export function createSessionStorage(storage) {
  const preferenceKey = 'rebyuit.remember-me';
  const memory = new Map();

  async function getRememberMe() {
    return (await storage.getItem(preferenceKey)) === 'true';
  }

  return {
    getRememberMe,

    async getItem(key) {
      if (memory.has(key)) return memory.get(key);

      const remember = await getRememberMe();
      const value = remember ? await storage.getItem(key) : null;
      if (!remember) await storage.removeItem(key);
      memory.set(key, value);
      return value;
    },

    async setItem(key, value) {
      if (await getRememberMe()) {
        await storage.setItem(key, value);
      } else {
        await storage.removeItem(key);
      }
      memory.set(key, value);
    },

    async removeItem(key) {
      await storage.removeItem(key);
      memory.delete(key);
    },

    async setRememberMe(remember) {
      // Disable restoration before deleting tokens, even if storage cleanup fails.
      if (!remember) await storage.setItem(preferenceKey, 'false');

      for (const [key, value] of memory) {
        if (remember && value !== null) {
          await storage.setItem(key, value);
        } else {
          await storage.removeItem(key);
        }
      }

      if (remember) await storage.setItem(preferenceKey, 'true');
    },
  };
}
