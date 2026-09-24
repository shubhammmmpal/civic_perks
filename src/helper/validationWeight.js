// utils/validationWeight.js

export const getValidationWeight = (user) => {
  const level = Number(user.level || 1);
  const trustScore = Number(user.trustScore || 0);

  /*
   * Base weight according to level
   */
  let levelWeight = 10;

  if (level >= 15) {
    levelWeight = 60;
  } else if (level >= 10) {
    levelWeight = 45;
  } else if (level >= 5) {
    levelWeight = 25;
  }

  /*
   * Trust multiplier
   *
   * 99 trust -> ~1.49
   * 80 trust -> ~1.40
   * 50 trust -> ~1.25
   */
  const trustMultiplier = 1 + trustScore / 200;

  const weight = Math.round(levelWeight * trustMultiplier);

  return Math.min(weight, 100);
};