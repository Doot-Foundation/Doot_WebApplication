async function incrementCallCounter(obj) {
  const now = new Date();
  const currentMonth = now.getMonth();

  const months = Object.keys(obj);
  const toIncrement = months[currentMonth];

  obj[toIncrement]++;

  return obj;
}

module.exports = incrementCallCounter;
