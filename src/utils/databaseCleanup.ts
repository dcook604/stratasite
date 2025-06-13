/**
 * Database cleanup utilities for marketplace data
 * Helps maintain database performance and storage efficiency
 */

export interface CleanupStats {
  postsDeleted: number;
  repliesDeleted: number;
  imagesDeleted: number;
  spaceFreed: string;
}

export interface CleanupOptions {
  deleteOlderThanDays?: number;
  deleteSoldItems?: boolean;
  deleteInactivePosts?: boolean;
  deleteOrphanedImages?: boolean;
  dryRun?: boolean;
}

export const cleanupMarketplaceData = async (options: CleanupOptions = {}): Promise<CleanupStats> => {
  const {
    deleteOlderThanDays = 90,
    deleteSoldItems = false,
    deleteInactivePosts = true,
    deleteOrphanedImages = true,
    dryRun = false
  } = options;

  try {
    const response = await fetch('/api/admin/cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deleteOlderThanDays,
        deleteSoldItems,
        deleteInactivePosts,
        deleteOrphanedImages,
        dryRun
      })
    });

    if (!response.ok) {
      throw new Error('Cleanup operation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Database cleanup error:', error);
    throw error;
  }
};

export const getCleanupPreview = async (options: CleanupOptions): Promise<CleanupStats> => {
  return cleanupMarketplaceData({ ...options, dryRun: true });
};

export const formatCleanupStats = (stats: CleanupStats): string => {
  const parts = [];
  
  if (stats.postsDeleted > 0) {
    parts.push(`${stats.postsDeleted} posts`);
  }
  
  if (stats.repliesDeleted > 0) {
    parts.push(`${stats.repliesDeleted} replies`);
  }
  
  if (stats.imagesDeleted > 0) {
    parts.push(`${stats.imagesDeleted} images`);
  }

  if (parts.length === 0) {
    return 'No items found for cleanup';
  }

  let result = `Cleaned up: ${parts.join(', ')}`;
  if (stats.spaceFreed) {
    result += ` | Space freed: ${stats.spaceFreed}`;
  }

  return result;
}; 