import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { toast } from 'react-toastify';
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

const CATEGORY_OPTIONS = [
  'Politics', 'Sports', 'Business', 'Health', 'Science', 'Economics'
];

const BLOCK_TYPES = [
  { type: 'paragraph', label: 'Text' },
  { type: 'table', label: 'Table' },
];

function BlockMenuBar({ editor, type }) {
  if (!editor) return null;
  if (type === 'paragraph') {
    return (
      <div className="flex gap-2 mb-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-100'}`}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-blue-100 text-blue-700 italic' : 'hover:bg-gray-100'}`}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`px-2 py-1 rounded ${editor.isActive('underline') ? 'bg-blue-100 text-blue-700 underline' : 'hover:bg-gray-100'}`}>U</button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`px-2 py-1 rounded ${editor.isActive('strike') ? 'bg-blue-100 text-blue-700 line-through' : 'hover:bg-gray-100'}`}>S</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-100'}`}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-100'}`}>H2</button>
      </div>
    );
  }
  if (type === 'table') {
    return (
      <div className="flex flex-wrap gap-2 mb-2">
        {/* Basic formatting for table cells */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-100'}`}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-blue-100 text-blue-700 italic' : 'hover:bg-gray-100'}`}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`px-2 py-1 rounded ${editor.isActive('underline') ? 'bg-blue-100 text-blue-700 underline' : 'hover:bg-gray-100'}`}>U</button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`px-2 py-1 rounded ${editor.isActive('strike') ? 'bg-blue-100 text-blue-700 line-through' : 'hover:bg-gray-100'}`}>S</button>
        {/* Table controls */}
        <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} className="px-2 py-1 rounded hover:bg-gray-100">+Col Left</button>
        <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 py-1 rounded hover:bg-gray-100">+Col Right</button>
        <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="px-2 py-1 rounded hover:bg-gray-100">-Del Col</button>
        <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} className="px-2 py-1 rounded hover:bg-gray-100">+Row Above</button>
        <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 py-1 rounded hover:bg-gray-100">+Row Below</button>
        <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="px-2 py-1 rounded hover:bg-gray-100">-Del Row</button>
      </div>
    );
  }
  return null;
}

function BlockEditor({ block, onChange, onRemove, onAddBlock, idx, totalBlocks }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Table.configure({ resizable: true, allowTableCellMerge: true, lastColumnResizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: block.content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && block.content === '') {
      editor.commands.setContent('');
    }
  }, [editor]);

  return (
    <div className="mb-8 bg-gray-50 rounded-lg border border-gray-200 p-4 relative">
      <BlockMenuBar editor={editor} type={block.type} />
      <EditorContent 
        editor={editor} 
        className="border border-gray-300 rounded-lg bg-white p-3 min-h-[120px] focus-within:ring-2 focus-within:ring-blue-400 transition" 
      />
      <div className="flex gap-2 mt-2">
        <button type="button" onClick={onRemove} className="text-xs text-red-600 hover:underline">Remove</button>
        <div className="flex gap-2 ml-auto">
          {BLOCK_TYPES.map(bt => (
            <button
              key={bt.type}
              type="button"
              className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 border border-blue-200"
              onClick={() => onAddBlock(bt.type, idx)}
            >
              + {bt.label} below
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NewsForm() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [coverImage, setCoverImage] = useState(''); // URL to be sent to backend
  const [coverFile, setCoverFile] = useState(null); // File object
  const [coverPreview, setCoverPreview] = useState(null); // Preview URL
  const [uploading, setUploading] = useState(false);
  const { token } = useAuth();

  // Section/block state
  const [blocks, setBlocks] = useState([
    { id: Date.now(), type: 'paragraph', content: '' },
  ]);

  const handleBlockChange = (idx, html) => {
    setBlocks(blocks => blocks.map((b, i) => i === idx ? { ...b, content: html } : b));
  };

  const handleAddBlock = (type, afterIdx) => {
    setBlocks(blocks => {
      const newBlock = { id: Date.now() + Math.random(), type, content: type === 'table' ? '<table><tbody><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>' : '' };
      const newBlocks = [...blocks];
      newBlocks.splice(afterIdx + 1, 0, newBlock);
      return newBlocks;
    });
  };

  const handleRemoveBlock = (idx) => {
    setBlocks(blocks => blocks.length === 1 ? blocks : blocks.filter((_, i) => i !== idx));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error('Cover image must be less than 500KB');
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);
    const res = await fetch(CLOUDINARY_CONFIG.UPLOAD_URL, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let uploadedCoverUrl = coverImage;
      if (coverFile) {
        uploadedCoverUrl = await uploadToCloudinary(coverFile);
        setCoverImage(uploadedCoverUrl);
      }
      // Combine all block HTML into a single string
      const content = blocks.map(b => b.content).join('<br/>' /* or '' for no gap */);
      await api.post('/news', {
        title,
        content,
        cover_image: uploadedCoverUrl,
        category
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTitle('');
      setBlocks([{ id: Date.now(), type: 'paragraph', content: '' }]);
      setCoverImage('');
      setCoverFile(null);
      setCoverPreview(null);
      setCategory('');
      toast.success('News posted!');
    } catch (err) {
      toast.error('News post or image upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto bg-white rounded-sm shadow-md p-10 space-y-8 border border-gray-100 mt-0"
    >
      <h2 className="text-2xl text-gray-900 mb-4">Submit News Article</h2>
      <div className="space-y-2">
        <label className="block text-gray-600 font-medium">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          required
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-lg"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-gray-600 font-medium">Content</label>
        {blocks.map((block, idx) => (
          <BlockEditor
            key={block.id}
            block={block}
            onChange={html => handleBlockChange(idx, html)}
            onRemove={() => handleRemoveBlock(idx)}
            onAddBlock={handleAddBlock}
            idx={idx}
            totalBlocks={blocks.length}
          />
        ))}
      </div>
      <div className="space-y-2">
        <label className="block text-gray-600 font-medium">Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 cursor-pointer"
        >
          <option value="">Select Category</option>
          {CATEGORY_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="block text-gray-600 font-medium">Cover Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full text-gray-700 border border-gray-200 p-2 rounded-lg"
        />
        {uploading && <div className="text-blue-500">Uploading image...</div>}
        {coverPreview && (
          <img src={coverPreview} alt="Cover Preview" className="max-h-40 mt-2 rounded-lg border" />
        )}
      </div>
      <button
        type="submit"
        className="w-full bg-red-900 text-white py-2 rounded-lg hover:bg-red-800 transition text-lg shadow cursor-pointer"
        disabled={uploading}
      >
        Publish Article
      </button>
    </form>
  );
}

import './tiptap-table.css'; 