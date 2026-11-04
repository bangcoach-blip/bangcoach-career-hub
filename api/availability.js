const { getAvailability, WORK_START, WORK_END } = require("./_calendar");

module.exports = async function handler(req, res) {
  if (!process.env.GOOGLE_SA_JSON || !process.env.GOOGLE_CALENDAR_IDS) {
    res.setHeader("Cache-Control", "s-maxage=60");
    res.status(200).json({ configured: false, days: [] });
    return;
  }
  try {
    const days = await getAvailability();
    res.setHeader("Cache-Control", "s-maxage=300");
    res.status(200).json({ configured: true, workStart: WORK_START, workEnd: WORK_END, days });
  } catch (e) {
    console.error("availability", e.message);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ configured: true, error: true, days: [] });
  }
};
