import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Eye, EyeOff } from 'lucide-react';
import { useCrypto } from '../../contexts/CryptoContext';
import toast from 'react-hot-toast';

export default function SetupPassphrase() {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirmPassphrase, setShowConfirmPassphrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { unlock } = useCrypto();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passphrase !== confirmPassphrase) {
      toast.error('Passphrases do not match');
      return;
    }

    if (passphrase.length < 12) {
      toast.error('Passphrase must be at least 12 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await unlock(passphrase);
      toast.success('Encryption setup complete!');
      navigate('/app');
    } catch (error) {
      toast.error('Failed to setup encryption');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Key className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Setup Encryption</h2>
        <p className="text-gray-400">Create a secure passphrase to encrypt your notes</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Encryption Passphrase
          </label>
          <div className="relative">
            <input
              type={showPassphrase ? 'text' : 'password'}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full px-4 py-3 pr-12 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter a strong passphrase"
              minLength={12}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassphrase(!showPassphrase)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              {showPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Confirm Passphrase
          </label>
          <div className="relative">
            <input
              type={showConfirmPassphrase ? 'text' : 'password'}
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              className="w-full px-4 py-3 pr-12 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Confirm your passphrase"
              minLength={12}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassphrase(!showConfirmPassphrase)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              {showConfirmPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="text-red-200 text-sm">
          <strong>Warning:</strong> If you forget this passphrase, your notes will be unrecoverable. 
          We recommend using a passphrase manager or writing it down securely.
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || passphrase.length < 12}
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Setting up...' : 'Complete Setup'}
      </button>
    </form>
  );
}