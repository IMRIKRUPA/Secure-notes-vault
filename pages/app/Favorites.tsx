import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Edit3, Download, Trash2, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useCrypto } from '../../contexts/CryptoContext';
import toast from 'react-hot-toast';

interface Note {
  _id: string;
  title: string;
  content: {
    ciphertext: string;
    iv: string;
    salt: string;
  };
  isFavorite: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Favorites() {
  const [decryptedNotes, setDecryptedNotes] = useState<Map<string, string>>(new Map());
  const { decrypt, isUnlocked } = useCrypto();

  const { data: notes = [], isLoading, refetch } = useQuery({
    queryKey: ['favoriteNotes'],
    queryFn: async () => {
      const response = await api.get('/notes');
      return response.data.filter((note: Note) => !note.isDeleted && note.isFavorite);
    },
    enabled: isUnlocked,
  });

  useEffect(() => {
    if (notes.length > 0 && isUnlocked) {
      decryptNotes();
    }
  }, [notes, isUnlocked]);

  const decryptNotes = async () => {
    const decrypted = new Map();
    
    for (const note of notes) {
      try {
        const decryptedContent = await decrypt(
          note.content.ciphertext,
          note.content.iv,
          note.content.salt
        );
        decrypted.set(note._id, decryptedContent);
      } catch (error) {
        console.error('Failed to decrypt note:', note._id);
      }
    }
    
    setDecryptedNotes(decrypted);
  };

  const handleToggleFavorite = async (noteId: string) => {
    try {
      await api.patch(`/notes/${noteId}`, { isFavorite: false });
      await refetch();
      toast.success('Removed from favorites');
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/notes/${noteId}`);
      await refetch();
      toast.success('Note moved to trash');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleDownloadNote = (note: Note) => {
    const content = decryptedNotes.get(note._id) || '';
    const blob = new Blob([`${note.title}\n\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Note downloaded');
  };

  if (!isUnlocked) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Vault Locked</h2>
        <p className="text-gray-400">Please unlock your vault with your passphrase to access your notes.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Favorite Notes
          </h1>
          <p className="text-gray-400 mt-1">
            {notes.length} {notes.length === 1 ? 'favorite note' : 'favorite notes'}
          </p>
        </div>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-60">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No favorite notes yet</h3>
          <p className="text-gray-500 mb-6">
            Star your important notes to see them here
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-yellow-500/25"
          >
            View All Notes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note: Note) => {
            const decryptedContent = decryptedNotes.get(note._id) || '';
            const previewContent = decryptedContent.slice(0, 150) + (decryptedContent.length > 150 ? '...' : '');

            return (
              <div
                key={note._id}
                className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 hover:from-yellow-500/15 hover:to-orange-500/15 hover:border-yellow-500/30 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors line-clamp-2">
                    {note.title}
                  </h3>
                  <button
                    onClick={() => handleToggleFavorite(note._id)}
                    className="text-yellow-400 hover:text-yellow-300 p-1 rounded-lg transition-colors"
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-4">
                  {previewContent}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-yellow-500/20">
                  <span className="text-xs text-gray-500">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/app/edit/${note._id}`}
                      className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-all"
                      title="Edit note"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    
                    <button
                      onClick={() => handleDownloadNote(note)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all"
                      title="Download note"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteNote(note._id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}