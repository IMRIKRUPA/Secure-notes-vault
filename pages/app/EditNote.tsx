import  { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Download, Heart, Trash2, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCrypto } from '../../contexts/CryptoContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export default function EditNote() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { decrypt, encrypt } = useCrypto();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(false);

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: async () => {
      const response = await api.get(`/notes/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (note && !isDecrypted) {
      decryptNote();
    }
  }, [note]);

  const decryptNote = async () => {
    if (!note) return;

    try {
      const decryptedContent = await decrypt(
        note.content.ciphertext,
        note.content.iv,
        note.content.salt
      );
      
      setTitle(note.title);
      setContent(decryptedContent);
      setIsFavorite(note.isFavorite);
      setIsDecrypted(true);
    } catch (error) {
      toast.error('Failed to decrypt note');
      navigate('/app');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    setIsSaving(true);

    try {
      const encryptedContent = await encrypt(content);
      
      await api.patch(`/notes/${id}`, {
        title: title.trim(),
        content: encryptedContent,
        isFavorite,
      });

      toast.success('Note updated successfully!');
      navigate('/app');
    } catch (error) {
      toast.error('Failed to update note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please add title and content before downloading');
      return;
    }

    const blob = new Blob([`${title}\n\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Note downloaded');
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note? It will be moved to trash.')) {
      try {
        await api.delete(`/notes/${id}`);
        toast.success('Note moved to trash');
        navigate('/app');
      } catch (error) {
        toast.error('Failed to delete note');
      }
    }
  };

  if (isLoading || !isDecrypted) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Edit Note
            </h1>
            <p className="text-gray-400 mt-1">Make changes to your encrypted note</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-3 rounded-xl transition-all ${
              isFavorite
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-yellow-400'
            }`}
            title="Toggle favorite"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleDownload}
            disabled={!title.trim() || !content.trim()}
            className="p-3 bg-gray-800/50 text-gray-400 border border-gray-700/50 rounded-xl hover:text-blue-400 hover:border-blue-500/30 transition-all disabled:opacity-50"
            title="Download note"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={handleDelete}
            className="p-3 bg-gray-800/50 text-gray-400 border border-gray-700/50 rounded-xl hover:text-red-400 hover:border-red-500/30 transition-all"
            title="Delete note"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !content.trim()}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
        {/* Title Input */}
        <div className="p-6 border-b border-gray-700/50">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter note title..."
            className="w-full text-2xl font-bold bg-transparent text-white placeholder-gray-500 focus:outline-none"
            maxLength={100}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {title.length}/100 characters
            </span>
            {isFavorite && (
              <div className="flex items-center gap-1 text-xs text-yellow-400">
                <Heart className="w-3 h-3 fill-current" />
                Favorite
              </div>
            )}
          </div>
        </div>

        {/* Content Textarea */}
        <div className="p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here... It will be encrypted before saving."
            className="w-full h-96 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none leading-relaxed"
            spellCheck="true"
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-gray-500">
              {content.length} characters • {content.split(/\s+/).filter(word => word.length > 0).length} words
            </span>
            <span className="text-xs text-green-400 flex items-center gap-1">
              🔒 End-to-end encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <p className="text-blue-200 text-sm">
          <strong>Privacy Note:</strong> Your changes are encrypted client-side before being sent to the server. 
          Only you can decrypt and read them with your passphrase.
        </p>
      </div>
    </div>
  );
}