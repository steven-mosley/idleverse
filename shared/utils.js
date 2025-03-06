// Shared utility functions between client and server

/**
 * Calculate distance between two points
 * @param {Object} point1 - Point with x and y coordinates
 * @param {Object} point2 - Point with x and y coordinates
 * @returns {number} - Distance between points
 */
const calculateDistance = (point1, point2) => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Format time in mm:ss format
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Generate a random position within bounds
 * @param {number} minX - Minimum X coordinate
 * @param {number} maxX - Maximum X coordinate
 * @param {number} minY - Minimum Y coordinate
 * @param {number} maxY - Maximum Y coordinate
 * @returns {Object} - Random position with x and y coordinates
 */
const getRandomPosition = (minX = -30, maxX = 30, minY = -30, maxY = 30) => {
  return {
    x: minX + Math.random() * (maxX - minX),
    y: minY + Math.random() * (maxY - minY)
  };
};

/**
 * Get color for resource type
 * @param {string} resourceType - Type of resource
 * @returns {string} - Hex color code
 */
const getResourceColor = (resourceType) => {
  switch(resourceType) {
    case 'wood': return '#8B4513';
    case 'stone': return '#A9A9A9';
    case 'food': return '#FF6347';
    case 'iron': return '#B0C4DE';
    case 'herbs': return '#90EE90';
    default: return '#FFC107';
  }
};

module.exports = {
  calculateDistance,
  formatTime,
  getRandomPosition,
  getResourceColor
};
