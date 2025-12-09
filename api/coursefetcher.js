
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { courseName } = req.query;

  if (!courseName) {
    return res.status(400).json({ error: "Missing courseName query parameter" });
  }

  try {
    const searchUrl = `https://www.englandgolf.org/find-a-course/?q=${encodeURIComponent(courseName)}`;
    const searchRes = await fetch(searchUrl);
    const searchHTML = await searchRes.text();
    const $ = cheerio.load(searchHTML);

    const courseLink = $('a.course-link').first().attr('href');
    if (!courseLink) {
      return res.status(404).json({ error: "Course not found" });
    }

    const coursePageRes = await fetch(courseLink);
    const courseHTML = await coursePageRes.text();
    const $$ = cheerio.load(courseHTML);

    const holes = [];
    $$('#scorecard-table tbody tr').each((i, el) => {
      const tds = $$(el).find('td');
      const hole = i + 1;
      const par = parseInt($$(tds[1]).text());
      const si = parseInt($$(tds[2]).text());
      holes.push({ hole, par, si });
    });

    if (holes.length === 0) {
      return res.status(500).json({ error: "Failed to parse course data" });
    }

    res.status(200).json({ holes });
  } catch (err) {
    console.error("Error fetching course:", err);
    res.status(500).json({ error: "Internal server error", detail: err.message });
  }
}
