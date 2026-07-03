import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugToTitle(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function parseSkDate(day: string, month: string, year: string, time: string): string {
  // day/month/year as strings, time as "19.00" or "19:00"
  const t = time.replace('.', ':').replace(/\s*h\s*$/, '').trim()
  const m = String(parseInt(month)).padStart(2, '0')
  const d = String(parseInt(day)).padStart(2, '0')
  return `${year}-${m}-${d}T${t}:00`
}

// ── SND scraper ───────────────────────────────────────────────────────────────

async function scrapeSND(theatreId: string) {
  const shows: ShowInput[] = []
  const now = new Date()
  const months = [
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`,
    `${now.getFullYear()}-${String(now.getMonth() + 3).padStart(2, '0')}`,
  ]

  for (const month of months) {
    const url = month === months[0]
      ? 'https://snd.sk/program/'
      : `https://snd.sk/program/${month}`

    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html' },
    }).catch(() => null)
    if (!res?.ok) continue

    const html = await res.text()
    const perfRegex = /<div id="performance-(\d+)"[^>]*>([\s\S]*?)(?=<div id="performance-|\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<div class="more|$)/g
    let match: RegExpExecArray | null

    while ((match = perfRegex.exec(html)) !== null) {
      const id = match[1]
      const block = match[2]

      const titleM = block.match(/class="title"[^>]*title="([^"]+)"/)
      const dateM = block.match(/class="on-date">([^<]+)</)
      const timeM = block.match(/class="time-from">([^<&]+)/)
      const venueM = block.match(/class="place[^"]*"[^>]*title="([^"]+)"/)
      const slugM = block.match(/href="\/predstavenie\/\d+\/[^/]+\/[^/]+\/([a-z0-9-]+)\//)

      if (!titleM || !dateM || !timeM) continue

      const [day, m, year] = dateM[1].trim().split('.')
      const time = timeM[1].trim().replace(/&nbsp;/g, '')
      const isoDate = parseSkDate(day, m, year, time)

      if (new Date(isoDate) < new Date()) continue

      shows.push({
        theatre_id: theatreId,
        title: titleM[1],
        slug: slugM?.[1] ?? null,
        venue: venueM?.[1] ?? 'SND',
        starts_at: isoDate,
        ticket_url: slugM ? `https://snd.sk/predstavenie/${id}/${dateM[1].replace(/\./g, '-').split('-').reverse().join('-')}/${time.replace(':', '-')}/${slugM[1]}` : null,
        external_id: `snd-${id}-${isoDate}`,
      })
    }
  }

  return shows
}

// ── DPOH scraper ──────────────────────────────────────────────────────────────

async function scrapeDPOH(theatreId: string) {
  const shows: ShowInput[] = []

  const res = await fetch('https://www.dpoh.sk/program', {
    headers: { 'User-Agent': UA },
  }).catch(() => null)
  if (!res?.ok) return shows

  const html = await res.text()
  const cardRegex = /<a\s+href="(\/[^"]+)"[^>]*>[\s\S]*?<div[^>]*>\s*(\w+)\s*<\/div>\s*<div[^>]*>\s*(\d+)\s*<\/div>[\s\S]*?<div[^>]*>\s*([\d:]+)\s*<\/div>[\s\S]*?<div[^>]*>([^<]+)<\/div>[\s\S]*?<\/a>/g
  // Alternative: parse by date cards
  const dateBlocks = html.split('<a href="')
  const now = new Date()

  for (const block of dateBlocks.slice(1)) {
    const hrefM = block.match(/^(\/[^"]+)"/)
    const monthM = block.match(/class="[^"]*month[^"]*">([^<]+)</)
    const dayM = block.match(/class="[^"]*day[^"]*">(\d+)</)
    const timeM = block.match(/class="[^"]*time[^"]*">([\d:]+)</)
    const titleM = block.match(/class="[^"]*title[^"]*">([^<]+)</)

    if (!monthM || !dayM || !titleM) continue

    const monthMap: Record<string, string> = {
      'január': '01', 'február': '02', 'marec': '03', 'apríl': '04',
      'máj': '05', 'jún': '06', 'júl': '07', 'august': '08',
      'september': '09', 'október': '10', 'november': '11', 'december': '12',
    }
    const monthNum = monthMap[monthM[1].toLowerCase().trim()]
    if (!monthNum) continue

    const year = new Date().getFullYear()
    const isoDate = `${year}-${monthNum}-${String(parseInt(dayM[1])).padStart(2, '0')}T${timeM?.[1] ?? '19:00'}:00`

    if (new Date(isoDate) < now) continue

    const href = hrefM?.[1]
    shows.push({
      theatre_id: theatreId,
      title: titleM[1].replace(/♿/g, '').trim(),
      slug: href?.split('/').pop() ?? null,
      venue: 'DPOH',
      starts_at: isoDate,
      ticket_url: href ? `https://www.dpoh.sk${href}` : null,
      external_id: `dpoh-${isoDate}-${titleM[1].slice(0, 20)}`,
    })
  }

  return shows
}

// ── Gss CMS scraper (Aréna + Nová scéna) ─────────────────────────────────────

async function scrapeGss(theatreId: string, baseUrl: string, programPath: string) {
  const shows: ShowInput[] = []
  const now = new Date()

  const months = [
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`,
    `${now.getFullYear()}-${String(now.getMonth() + 3).padStart(2, '0')}`,
  ]

  for (const month of months) {
    const body = new URLSearchParams({
      '_request': 'App\\Requests\\Frontend\\ProgramFilter',
      'act': 'itemsubmit',
      'class': 'program',
      'iid': '1',
      'lng': 'default',
      'tset': 'ajax',
      'tname': 'default',
      'itemclickparam': 'filter',
    })
    body.append('month[]', month)

    const res = await fetch(`${baseUrl}${programPath}`, {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: body.toString(),
    }).catch(() => null)
    if (!res?.ok) continue

    let json: { html?: string }
    try { json = await res.json() } catch { continue }
    if (!json.html) continue

    const html = json.html

    // Parse c-grid items
    const gridRegex = /<div class="c-grid"[^>]*>[\s\S]*?<div class="c-grid__date__month">([^<]+)<\/div>\s*<div class="c-grid__date__day">(\d+)<\/div>[\s\S]*?<div class="c-grid__date__time">([\d:]+)<\/div>[\s\S]*?<h3 class="c-grid__content__title"><a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a><\/h3>([\s\S]*?)(?=<div class="c-grid"|$)/g
    let m: RegExpExecArray | null

    const monthMapSk: Record<string, string> = {
      'Január': '01', 'Február': '02', 'Marec': '03', 'Apríl': '04',
      'Máj': '05', 'Jún': '06', 'Júl': '07', 'August': '08',
      'September': '09', 'Október': '10', 'November': '11', 'December': '12',
    }

    while ((m = gridRegex.exec(html)) !== null) {
      const [, monthName, day, time, href, title, rest] = m
      const monthNum = monthMapSk[monthName.trim()]
      if (!monthNum) continue

      const descM = rest.match(/class="c-grid__content__perex[^"]*">([^<]+)</)
      const venueM = rest.match(/class="bar__content[^"]*">(VEĽKÁ SÁLA|MALÁ SÁLA|[^<]{3,30})<\/div>/)
      const ticketM = rest.match(/href="([^"]+\/buy)"/)

      const isoDate = `${now.getFullYear()}-${monthNum}-${String(parseInt(day)).padStart(2, '0')}T${time}:00`
      if (new Date(isoDate) < now) continue

      const slug = href.split('/').filter(Boolean).pop() ?? null

      shows.push({
        theatre_id: theatreId,
        title: title.trim(),
        slug,
        description: descM?.[1]?.trim() ?? null,
        venue: venueM?.[1]?.trim() ?? null,
        starts_at: isoDate,
        ticket_url: ticketM ? `${baseUrl}${ticketM[1]}` : `${baseUrl}${href}`,
        external_id: `${slug}-${isoDate}`,
      })
    }
  }

  return shows
}

// ── GUnaGU scraper (WordPress Events Calendar) ───────────────────────────────

async function scrapeGUnaGU(theatreId: string) {
  const shows: ShowInput[] = []
  const now = new Date()

  let page = 1
  while (page <= 3) {
    const url = `https://gunagu.sk/wp-json/tribe/events/v1/events?per_page=20&page=${page}&start_date=${now.toISOString().split('T')[0]}`
    const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null)
    if (!res?.ok) break

    let json: { events?: Array<{
      id: number; title: string; slug: string; start_date: string;
      description?: string; url?: string; venue?: { venue?: string }
    }>; total_pages?: number }

    try { json = await res.json() } catch { break }
    if (!json.events?.length) break

    for (const ev of json.events) {
      shows.push({
        theatre_id: theatreId,
        title: ev.title.replace(/&#8211;/g, '–').replace(/&amp;/g, '&').trim(),
        slug: ev.slug,
        description: ev.description
          ? ev.description.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500)
          : null,
        venue: ev.venue?.venue ?? 'GUnaGU',
        starts_at: ev.start_date.replace(' ', 'T'),
        ticket_url: ev.url ?? null,
        external_id: `gunagu-${ev.id}`,
      })
    }

    if (page >= (json.total_pages ?? 1)) break
    page++
  }

  return shows
}

// ── MDB scraper ───────────────────────────────────────────────────────────────

async function scrapeMDB(theatreId: string) {
  // MDB has TLS issues from some networks — try and skip silently if unavailable
  const shows: ShowInput[] = []
  const res = await fetch('https://mdb.sk/program', {
    headers: { 'User-Agent': UA },
  }).catch(() => null)
  if (!res?.ok) return shows

  const html = await res.text()
  // MDB uses Gss CMS too — try JSON AJAX
  const body = new URLSearchParams({
    '_request': 'App\\Requests\\Frontend\\ProgramFilter',
    'act': 'itemsubmit', 'class': 'program', 'iid': '1',
    'lng': 'default', 'tset': 'ajax', 'tname': 'default', 'itemclickparam': 'filter',
  })
  const now = new Date()
  body.append('month[]', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  const ajaxRes = await fetch('https://mdb.sk/program', {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'application/json, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: body.toString(),
  }).catch(() => null)

  if (!ajaxRes?.ok) return shows

  let json: { html?: string }
  try { json = await ajaxRes.json() } catch { return shows }
  if (!json.html) return shows

  return scrapeGss(theatreId, 'https://mdb.sk', '/program')
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ShowInput = {
  theatre_id: string
  title: string
  slug: string | null
  playwright?: string | null
  description?: string | null
  venue: string | null
  starts_at: string
  ticket_url: string | null
  external_id: string
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const { data: theatres, error: theatresError } = await supabase
    .from('theatres')
    .select('id, scraper_id')

  if (theatresError) {
    return new Response(JSON.stringify({ error: theatresError.message }), { status: 500 })
  }

  const theatreMap = Object.fromEntries(theatres.map(t => [t.scraper_id, t.id]))
  const results: Record<string, number> = {}
  const errors: Record<string, string> = {}

  const scrapers: Array<() => Promise<ShowInput[]>> = [
    () => scrapeSND(theatreMap['snd']),
    () => scrapeDPOH(theatreMap['dpoh']),
    () => scrapeGss(theatreMap['arena'], 'https://www.divadloarena.sk', '/program/'),
    () => scrapeGss(theatreMap['nova-scena'], 'https://www.novascena.sk', '/program'),
    () => scrapeGUnaGU(theatreMap['gunagu']),
    () => scrapeMDB(theatreMap['mdb']),
  ]

  const scraperNames = ['snd', 'dpoh', 'arena', 'nova-scena', 'gunagu', 'mdb']

  for (let i = 0; i < scrapers.length; i++) {
    const name = scraperNames[i]
    try {
      const shows = await scrapers[i]()
      if (shows.length === 0) { results[name] = 0; continue }

      // Deduplicate within the batch to avoid ON CONFLICT errors
      const seen = new Set<string>()
      const unique = shows.filter(s => {
        const key = `${s.theatre_id}:${s.external_id}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      const { error } = await supabase
        .from('upcoming_shows')
        .upsert(unique, { onConflict: 'theatre_id,external_id', ignoreDuplicates: false })

      if (error) errors[name] = error.message
      else results[name] = unique.length
    } catch (e) {
      errors[name] = String(e)
    }
  }

  // Clean up shows that already happened
  await supabase
    .from('upcoming_shows')
    .delete()
    .lt('starts_at', new Date().toISOString())

  return new Response(JSON.stringify({ results, errors, scraped_at: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
