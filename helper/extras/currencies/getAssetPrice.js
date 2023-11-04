const getPriceOfETH = require("./ETH.js");

async function priceOfETH() {
  return new Promise((resolve) => {
    const value = getPriceOfETH();
    resolve(value);
  });
}

function loadingAnimation() {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let frameIndex = 0;

  return setInterval(() => {
    process.stdout.write("\r" + frames[frameIndex] + " ");

    frameIndex++;
    if (frameIndex === frames.length) {
      frameIndex = 0;
    }
  }, 100);
}

// Start the loading animation
const animationInterval = loadingAnimation();

priceOfETH().then((value) => {
  clearInterval(animationInterval);
  console.log("\nETH price:", value);
});
