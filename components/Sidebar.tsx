import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, Heart, Trash2, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCrypto } from '../contexts/CryptoContext';
import toast from 'react-hot-toast';

const navigation = [
  { name: 'Home', href: '/app', icon: Home },
  { name: 'Add Note', href: '/app/add', icon: Plus },
  { name: 'Favorites', href: '/app/favorites', icon: Heart },
  { name: 'Trash', href: '/app/trash', icon: Trash2 },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { lock } = useCrypto();

  const handleLogout = async () => {
    try {
      lock();
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-gray-900/80 backdrop-blur-xl border-r border-gray-700/50">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Notes Vault</h2>
              <p className="text-sm text-gray-400">{user?.name}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-lg hover:shadow-black/20'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 transition-all duration-200 ${
                      isActive ? 'text-cyan-400' : 'text-gray-400 group-hover:text-white'
                    }`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 border border-transparent"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}