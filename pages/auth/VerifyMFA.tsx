import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Copy, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function VerifyMFA() {
  const [mfaCode, setMfaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyMFA } = useAuth();
  
  const { qrCode, secret, tempToken } = location.state || {};

  if (!tempToken) {
    navigate('/signup');
    return null;
  }

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast.success('Secret copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy secret');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await verifyMFA(tempToken, mfaCode);
      toast.success('MFA setup complete! Welcome to Secure Notes Vault.');
      navigate('/setup-passphrase');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid MFA code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Set Up Two-Factor Authentication</h2>
        <p className="text-gray-400">Scan the QR code with your authenticator app</p>
      </div>

      <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/50">
        <div className="text-center mb-4">
          <div className="bg-white p-4 rounded-xl inline-block">
            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-2">
            Can't scan? Enter this secret manually:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-800 text-cyan-400 px-3 py-2 rounded-lg text-sm font-mono break-all">
              {secret}
            </code>
            <button
              onClick={copySecret}
              className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
              title="Copy secret"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Enter the 6-digit code from your authenticator app
          </label>
          <input
            type="text"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            maxLength={6}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-center text-lg tracking-widest"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || mfaCode.length !== 6}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Verifying...' : 'Complete Setup'}
        </button>
      </form>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <p className="text-yellow-200 text-sm">
          <strong>Important:</strong> Save your secret key in a secure location. 
          You'll need it to set up MFA on other devices.
        </p>
      </div>
    </div>
  );
}