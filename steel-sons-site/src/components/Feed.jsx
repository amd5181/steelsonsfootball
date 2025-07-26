import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import PostCard from './PostCard';
import PostDrawer from './PostDrawer';

export default function Feed({ access }) {
  const [posts, setPosts] = useState([]);
  const [showComposer, setShowComposer] = useState(false);

  async function loadPosts() {
    const snapshot = await getDocs(collection(db, 'posts'));
    const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPosts(loaded.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
  }

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-4 px-4">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowComposer(true)}
          className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold py-2 px-4 rounded shadow"
        >
          + New Post
        </button>
      </div>

      <div className="my-6">
        <h2 className="text-2xl font-bold text-gray-800">🏈 Message Feed</h2>
      </div>

      {posts.map(post => (
        <PostCard
          key={post.id}
          postId={post.id}
          name={post.name}
          text={post.text}
          createdAt={post.createdAt}
          mediaUrl={post.mediaUrl}
          mediaType={post.mediaType}
          access={access}
          onUpdate={loadPosts}
        />
      ))}

      <PostDrawer open={showComposer} onClose={() => setShowComposer(false)} onPost={loadPosts} />
    </div>
  );
}
