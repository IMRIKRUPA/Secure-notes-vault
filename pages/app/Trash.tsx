import React, { useState, useEffect } from 'react';
import { RotateCcw, Trash2, Download } from 'lucide-react';
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
  deletedAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function Trash() {
  const [decryptedNotes, setDecryptedNotes] = useState<Map<string, string>>(new Map());
  const { decrypt, isUnlocked } = useCrypto();

  const { data: notes = [], isLoading, refetch } = useQuery({
    queryKey: ['trashedNotes'],
    queryFn: async () => {
      const response = await api.get('/notes');
      return response.data.filter((note: Note) => note.isDeleted);
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

  const handleRestoreNote = async (noteId: string) => {
    try {
      await api.post(`/notes/${noteId}/restore`);
      await refetch();
      toast.success('Note restored successfully');
    } catch (error) {
      toast.error('Failed to restore note');
    }
  };

  const handlePermanentDelete = async (noteId: string, noteTitle: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${noteTitle}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/notes/${noteId}/hard`);
        await refetch();
        toast.success('Note permanently deleted');
      } catch (error) {
        toast.error('Failed to delete note');
      }
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
        <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Vault Locked</h2>
        <p className="text-gray-400">Please unlock your vault with your passphrase to access trash.</p>
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
            Trash
          </h1>
          <p className="text-gray-400 mt-1">
            {notes.length} {notes.length === 1 ? 'deleted note' : 'deleted notes'}
          </p>
        </div>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-60">
            <Trash2 className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Trash is empty</h3>
          <p className="text-gray-500">Deleted notes will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note: Note) => {
            const decryptedContent = decryptedNotes.get(note._id) || '';
            const previewContent = decryptedContent.slice(0, 100) + (decryptedContent.length > 100 ? '...' : '');

            return (
              <div
                key={note._id}
                className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/60 hover:border-gray-600/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {note.title}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                        Deleted
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm leading-relaxed mb-3 line-clamp-2">
                      {previewContent}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Deleted: {new Date(note.deletedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleDownloadNote(note)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all"
                      title="Download note"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleRestoreNote(note._id)}
                      className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition-all"
                      title="Restore note"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handlePermanentDelete(note._id, note.title)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                      title="Delete permanently"
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

      {notes.length > 0 && (
        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-200 text-sm">
            <strong>Note:</strong> Notes in trash are still encrypted. Use the restore button to bring them back 
            or permanently delete them if no longer needed.
          </p>
        </div>
      )}
    </div>
  );
}