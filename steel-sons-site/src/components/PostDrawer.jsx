// src/components/PostDrawer.jsx
import React, { useEffect, useRef } from 'react';
import PostComposer from './PostComposer';
import { ChevronRight, X } from 'lucide-react';

export default function PostDrawer({ open, onClose, onPost }) {
  const drawerRef = useRef();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (open && drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose();
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full max-w-md z-50 transform transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40" />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 p-4 overflow-y-auto"
      >
        {/* Close X button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
          aria-label="Close drawer"
        >
          <X size={20} />
        </button>

        {/* Pull Tab */}
        <button
          onClick={onClose}
          className="absolute left-[-32px] top-1/2 transform -translate-y-1/2 bg-white border border-r-0 rounded-l-md shadow px-2 py-4 text-gray-600 hover:text-black"
          aria-label="Close drawer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">New Post</h2>
        <PostComposer onPost={onPost} />
      </div>
    </div>
  );
}
