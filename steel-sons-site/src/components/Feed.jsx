import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import PostCard from './PostCard';
import PostComposer from './PostComposer';

export default function Feed({ access }) {
  const [posts, setPosts] = useState([]);

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
      <PostComposer onPost={loadPosts} />

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
          access={access} // ✅ New: pass admin/guest access down
          onUpdate={loadPosts} // ✅ Optional: so PostCard can trigger reload after delete
        />
      ))}
    </div>
  );
}
