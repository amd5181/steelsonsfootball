import React, { useState } from 'react';
import PostComposer from './PostComposer';

export default function PostDrawer({ onPost }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-rose-500 text-white px-4 py-2 rounded-full shadow hover:bg-rose-600 transition"
          >
            + New Post
          </button>
        )}
      </div>

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-lg transform transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">New Post</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-600 text-2xl leading-none hover:text-gray-800"
            aria-label="Close"
          >
            &rarr;
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
          <PostComposer onPost={() => {
            setIsOpen(false);
            onPost?.();
          }} />
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
