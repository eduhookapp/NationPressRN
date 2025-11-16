export const formatIndianDate = (dateString) => {
  if (!dateString) return 'Recent';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recent';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return 'Recent';
  }
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Just now';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatIndianDate(dateString);
  } catch (error) {
    return 'Recent';
  }
};

export const getImageUrl = (imageData) => {
  if (!imageData) return null;
  
  if (typeof imageData === 'string') {
    return imageData.startsWith('http') ? imageData : `https://nation-press.s3.ap-south-1.amazonaws.com/${imageData}`;
  }
  
  if (imageData?.data?.attributes?.url) {
    return `https://nation-press.s3.ap-south-1.amazonaws.com${imageData.data.attributes.url}`;
  }
  
  if (imageData?.url) {
    return imageData.url.startsWith('http') ? imageData.url : `https://nation-press.s3.ap-south-1.amazonaws.com${imageData.url}`;
  }
  
  return null;
};

export const getPostSlug = (post) => {
  if (!post) return null;
  return post.shortSlug || post.slugUnique || post.slug || null;
};

export const stripHtml = (html) => {
  if (!html) return '';
  if (typeof html !== 'string') return String(html);
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  const stripped = stripHtml(text);
  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength).trim() + '...';
};

