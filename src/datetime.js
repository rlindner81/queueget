"use strict";
const TIME_UNITS = Object.freeze({
  YEAR: "year",
  MONTH: "month",
  DAY: "day",
  HOUR: "hour",
  MINUTE: "minute",
  SECOND: "second",
});

const TIME_UNIT_LIMITS = {
  [TIME_UNITS.YEAR]: 24 * 60 * 60 * 1000 * 365,
  [TIME_UNITS.MONTH]: (24 * 60 * 60 * 1000 * 365) / 12,
  [TIME_UNITS.DAY]: 24 * 60 * 60 * 1000,
  [TIME_UNITS.HOUR]: 60 * 60 * 1000,
  [TIME_UNITS.MINUTE]: 60 * 1000,
  [TIME_UNITS.SECOND]: 1000,
};

const _getRelativeDateTime = (d1, d2) => {
  let elapsed = d1 - d2;
  const result = [];
  for (const [unit, limit] of Object.entries(TIME_UNIT_LIMITS)) {
    if (Math.abs(elapsed) > limit || unit === TIME_UNITS.SECOND) {
      const diff = Math.trunc(elapsed / limit);
      elapsed -= limit * diff;
      result.push(`${diff} ${diff <= 1 ? unit : unit + "s"}`);
    }
  }
  return result.join(" ");
};

const readableRelativeDateTime = (value, now = new Date()) => {
  if (!value) return "";
  return _getRelativeDateTime(value, now);
};

module.exports = {
  readableRelativeDateTime,
};
