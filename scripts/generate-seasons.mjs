import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = 'https://en.wikipedia.org/w/api.php?action=parse&prop=wikitext&format=json&page=';
const START_SEASON = 4;
const END_SEASON = 35;

const fetchSeasonWikitext = async (seasonNumber) => {
  const page = `The_Simpsons_season_${seasonNumber}`;
  const response = await fetch(`${BASE_URL}${encodeURIComponent(page)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch season ${seasonNumber}: HTTP ${response.status}`);
  }

  const data = await response.json();
  const wikitext = data?.parse?.wikitext?.['*'];
  if (!wikitext) {
    throw new Error(`Missing wikitext for season ${seasonNumber}`);
  }

  return wikitext;
};

const extractTemplates = (text, marker) => {
  const templates = [];
  let index = 0;

  while (index < text.length) {
    const start = text.indexOf(marker, index);
    if (start === -1) {
      break;
    }

    let i = start;
    let depth = 0;
    let end = -1;

    while (i < text.length - 1) {
      const pair = text.slice(i, i + 2);
      if (pair === '{{') {
        depth += 1;
        i += 2;
        continue;
      }

      if (pair === '}}') {
        depth -= 1;
        i += 2;
        if (depth === 0) {
          end = i;
          break;
        }
        continue;
      }

      i += 1;
    }

    if (end === -1) {
      break;
    }

    templates.push(text.slice(start, end));
    index = end;
  }

  return templates;
};

const parseTemplateParams = (templateText) => {
  const params = {};
  const lines = templateText.split('\n');
  let currentKey = null;

  for (const line of lines) {
    const paramMatch = line.match(/^\s*\|\s*([^=|]+?)\s*=\s*(.*)$/);
    if (paramMatch) {
      currentKey = paramMatch[1].trim();
      params[currentKey] = paramMatch[2];
      continue;
    }

    if (currentKey) {
      params[currentKey] += `\n${line}`;
    }
  }

  return params;
};

const stripTemplates = (value) => {
  let text = value;

  // Repeatedly strip balanced templates.
  while (text.includes('{{')) {
    let changed = false;
    let result = '';
    let i = 0;

    while (i < text.length) {
      if (text.slice(i, i + 2) === '{{') {
        let depth = 1;
        i += 2;
        while (i < text.length && depth > 0) {
          if (text.slice(i, i + 2) === '{{') {
            depth += 1;
            i += 2;
          } else if (text.slice(i, i + 2) === '}}') {
            depth -= 1;
            i += 2;
          } else {
            i += 1;
          }
        }
        changed = true;
      } else {
        result += text[i];
        i += 1;
      }
    }

    text = result;
    if (!changed) {
      break;
    }
  }

  return text;
};

const stripMarkup = (value) => {
  let text = value ?? '';

  text = text.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '');
  text = text.replace(/<ref[^/>]*\/\s*>/gi, '');
  text = text.replace(/<br\s*\/?\s*>/gi, ' ');
  text = text.replace(/<[^>]+>/g, ' ');

  text = stripTemplates(text);

  text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  text = text.replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
    const withoutNamespace = inner.split(':').pop() ?? inner;
    return withoutNamespace.split('#')[0];
  });

  text = text.replace(/'''/g, '');
  text = text.replace(/''/g, '');
  text = text.replace(/\{\|[\s\S]*?\|\}/g, ' ');

  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '-')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

  text = text.replace(/\s+/g, ' ').trim();
  return text.length > 0 ? text : null;
};

const extractDate = (originalAirDate) => {
  if (!originalAirDate) {
    return null;
  }

  const startDate = originalAirDate.match(/\{\{\s*Start date\s*\|\s*(\d{4})\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})/i);
  if (startDate) {
    const year = startDate[1];
    const month = startDate[2].padStart(2, '0');
    const day = startDate[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const cleaned = stripMarkup(originalAirDate);
  if (!cleaned) {
    return null;
  }

  const date = new Date(cleaned);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const extractEpisodesFromWikitext = (wikitext, seasonNumber) => {
  const templates = extractTemplates(wikitext, '{{#invoke:Episode list|sublist|');

  const episodes = templates
    .map(parseTemplateParams)
    .map((params, index) => {
      const title = stripMarkup(params.Title);
      if (!title) {
        return null;
      }

      return {
        seasonNumber,
        episodeNumberInSeason: index + 1,
        title,
        originalReleaseDate: extractDate(params.OriginalAirDate),
        synopsis: stripMarkup(params.ShortSummary)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.episodeNumberInSeason - b.episodeNumberInSeason);

  if (episodes.length === 0) {
    throw new Error(`No episodes parsed for season ${seasonNumber}`);
  }

  return episodes;
};

const run = async () => {
  for (let seasonNumber = START_SEASON; seasonNumber <= END_SEASON; seasonNumber += 1) {
    const wikitext = await fetchSeasonWikitext(seasonNumber);
    const episodes = extractEpisodesFromWikitext(wikitext, seasonNumber);

    const outputPath = path.join('public', 'data', `season_${seasonNumber}.json`);
    await writeFile(outputPath, `${JSON.stringify(episodes, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${outputPath} (${episodes.length} episodes)`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
