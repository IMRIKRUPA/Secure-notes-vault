import React, { createContext, useContext, useState, ReactNode } from 'react';
import { encryptData, decryptData, deriveKey } from '../utils/crypto';

interface CryptoContextType {
  isUnlocked: boolean;
  encryptionKey: CryptoKey | null;
  unlock: (passphrase: string, salt?: Uint8Array) => Promise<{ key: CryptoKey; salt: Uint8Array }>;
  encrypt: (data: string) => Promise<{ ciphertext: string; iv: string; salt: string }>;
  decrypt: (ciphertext: string, iv: string, salt: string) => Promise<string>;
  lock: () => void;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);

  const unlock = async (passphrase: string, salt?: Uint8Array) => {
    const result = await deriveKey(passphrase, salt);
    setEncryptionKey(result.key);
    setIsUnlocked(true);
    return result;
  };

  const encrypt = async (data: string) => {
    if (!encryptionKey) throw new Error('Encryption key not available');
    return await encryptData(data, encryptionKey);
  };

  const decrypt = async (ciphertext: string, iv: string, salt: string) => {
    if (!encryptionKey) throw new Error('Encryption key not available');
    return await decryptData(ciphertext, iv, encryptionKey);
  };

  const lock = () => {
    setEncryptionKey(null);
    setIsUnlocked(false);
  };

  const value = {
    isUnlocked,
    encryptionKey,
    unlock,
    encrypt,
    decrypt,
    lock,
  };

  return (
    <CryptoContext.Provider value={value}>
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto() {
  const context = useContext(CryptoContext);
  if (context === undefined) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
}