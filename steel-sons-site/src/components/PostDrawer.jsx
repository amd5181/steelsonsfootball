import React, { useRef } from 'react';
import PostComposer from './PostComposer';

export default function PostDrawer({ open, onClose, onPost }) {
  const startXRef = useRef(null);

  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!startXRef.current) return;
    const deltaX = e.touches[0].clientX - startXRef.current;
    if (deltaX > 75) {
      onClose();
      startXRef.current = null;
    }
  };

  return (
    <div
      className={`fixed inset-0 z-40 transition-all duration-300 ${
        open ? 'visible' : 'invisible'
      }`}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black bg-opacity-30 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">New Post</h2>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-3xl text-gray-600 hover:text-rose-500 focus:outline-none"
            aria-label="Close"
          >
            &rarr;
          </button>

        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(100%-4rem)]">
          <PostComposer
            onPost={() => {
              onPost();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
