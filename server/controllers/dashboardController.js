// Dashboard controller for developer metrics

// Server start time (for uptime calculation)
const SERVER_START_TIME = Date.now();

// Store metrics history (for graphs)
const metricsHistory = {
  playerCount: [],
  resourceCount: [],
  tickRate: []
};

// Maximum history points to store
const MAX_HISTORY_POINTS = 100;

// Last server tick time
let lastTickTime = Date.now();
let tickRateHistory = [];

// Function to get dashboard data
function getDashboardData(gameWorld) {
  // Calculate server metrics
  const now = Date.now();
  const uptime = now - SERVER_START_TIME;
  
  // Calculate tick rate (averaging the last 10 ticks)
  if (tickRateHistory.length > 10) {
    tickRateHistory.shift();
  }
  tickRateHistory.push(now - lastTickTime);
  lastTickTime = now;
  
  const avgTickTime = tickRateHistory.reduce((sum, time) => sum + time, 0) / tickRateHistory.length;
  const tickRate = avgTickTime > 0 ? (1000 / avgTickTime) : 0;
  
  // Get players data
  const players = Object.values(gameWorld.players).map(player => ({
    id: player.id,
    name: player.name,
    position: player.position,
    state: player.state,
    targeting: player.targetResource,
    inventory: player.inventory
  }));
  
  // Get resources data
  const resources = gameWorld.resources;
  const activeResources = resources.filter(r => !r.depleted);
  
  // Count resources by type
  const resourcesByType = resources.reduce((counts, resource) => {
    if (!counts[resource.type]) {
      counts[resource.type] = { total: 0, active: 0 };
    }
    counts[resource.type].total++;
    if (!resource.depleted) {
      counts[resource.type].active++;
    }
    return counts;
  }, {});
  
  // Update metrics history
  if (metricsHistory.playerCount.length >= MAX_HISTORY_POINTS) {
    metricsHistory.playerCount.shift();
    metricsHistory.resourceCount.shift();
    metricsHistory.tickRate.shift();
  }
  
  metricsHistory.playerCount.push({
    time: now,
    value: players.length
  });
  
  metricsHistory.resourceCount.push({
    time: now,
    value: activeResources.length
  });
  
  metricsHistory.tickRate.push({
    time: now,
    value: tickRate
  });
  
  // Return full dashboard data
  return {
    server: {
      uptime: formatUptime(uptime),
      uptimeMs: uptime,
      worldTime: gameWorld.getFormattedTime(),
      tickRate: tickRate.toFixed(2)
    },
    players: {
      count: players.length,
      list: players,
      history: metricsHistory.playerCount
    },
    resources: {
      count: resources.length,
      active: activeResources.length,
      depleted: resources.length - activeResources.length,
      byType: resourcesByType,
      history: metricsHistory.resourceCount
    },
    performance: {
      tickRate: tickRate.toFixed(2),
      history: metricsHistory.tickRate
    }
  };
}

// Format uptime as days, hours, minutes, seconds
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}

// Export controller functions
module.exports = {
  getDashboardData
};
