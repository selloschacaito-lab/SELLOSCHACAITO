import React, { useState, useEffect } from 'react';
import { toggleProductLike } from '../services/db';

const LikeButton = ({ productId, initialLikes = 0 }) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes || 0);

  useEffect(() => {
    // Verificar si el usuario ya le dio me gusta
    const storedLikes = JSON.parse(localStorage.getItem('liked_products')) || [];
    if (storedLikes.includes(productId)) {
      setLiked(true);
    }
    setLikesCount(initialLikes || 0); // Sincronizar si cambia el prop
  }, [productId, initialLikes]);

  const handleToggleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const storedLikes = JSON.parse(localStorage.getItem('liked_products')) || [];
    const isCurrentlyLiked = liked;
    
    // Update Local State Optimistically
    setLiked(!isCurrentlyLiked);
    setLikesCount(prev => isCurrentlyLiked ? Math.max(0, prev - 1) : prev + 1);

    // Update Local Storage
    let newLikes;
    if (isCurrentlyLiked) {
      newLikes = storedLikes.filter(id => id !== productId);
    } else {
      newLikes = [...storedLikes, productId];
    }
    localStorage.setItem('liked_products', JSON.stringify(newLikes));

    // Update Database
    try {
      await toggleProductLike(productId, !isCurrentlyLiked);
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert if error
      setLiked(isCurrentlyLiked);
      setLikesCount(prev => isCurrentlyLiked ? prev + 1 : Math.max(0, prev - 1));
      localStorage.setItem('liked_products', JSON.stringify(storedLikes));
    }
  };

  return (
    <button
      onClick={handleToggleLike}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: liked ? '#e91e63' : 'var(--color-text-secondary)',
        padding: '0.25rem',
        transition: 'transform 0.2s, color 0.2s',
      }}
      title={liked ? "Quitar Me gusta" : "Me gusta"}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <span style={{ fontSize: '1rem', fontWeight: '600' }}>
        {likesCount > 0 ? likesCount : ''}
      </span>
    </button>
  );
};

export default LikeButton;
