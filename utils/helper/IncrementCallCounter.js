/**
 * Increments the call counter for the current month
 * @param {Object} obj - Object containing monthly counters
 * @returns {Object} Updated counter object
 */
async function incrementCallCounter(obj) {
  try {
    // Get current month index once
    const currentMonth = new Date().getMonth();

    // Get month key directly without creating array
    const monthKey = Object.keys(obj)[currentMonth];

    // Increment counter
    obj[monthKey]++;

    return obj;
  } catch (error) {
    console.error(
      "Error incrementing counter:",
      error.message || "Unknown error"
    );
    throw error;
  }
}

module.exports = incrementCallCounter;
