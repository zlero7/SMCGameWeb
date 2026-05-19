import { PrismaClient } from '@prisma/client'
import { getNeisCalendar, syncNeisToLocal } from '../services/neisCalendar.js'

const prisma = new PrismaClient()

// GET /api/calendar - List all events (with filters)
export async function getCalendarEvents(req, res) {
  try {
    const { type, month, year, search } = req.query

    let where = {}

    if (type) where.type = type

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0)
      where.start = { gte: startDate }
      where.end = { lte: endDate }
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ]
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { start: 'asc' }
    })

    res.json(events)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar events' })
  }
}

// GET /api/calendar/:id
export async function getCalendarEvent(req, res) {
  try {
    const event = await prisma.calendarEvent.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!event) return res.status(404).json({ error: 'Not found' })
    res.json(event)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event' })
  }
}

// POST /api/calendar
export async function createCalendarEvent(req, res) {
  try {
    const { title, start, end, type, description } = req.body

    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Title, start, and end required' })
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        start: new Date(start),
        end: new Date(end),
        type: type || 'general',
        description
      }
    })

    res.status(201).json(event)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create event' })
  }
}

// PUT /api/calendar/:id
export async function updateCalendarEvent(req, res) {
  try {
    const { title, start, end, type, description } = req.body

    const event = await prisma.calendarEvent.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(title && { title }),
        ...(start && { start: new Date(start) }),
        ...(end && { end: new Date(end) }),
        ...(type && { type }),
        ...(description !== undefined && { description })
      }
    })

    res.json(event)
  } catch (error) {
    res.status(400).json({ error: 'Failed to update event' })
  }
}

// DELETE /api/calendar/:id
export async function deleteCalendarEvent(req, res) {
  try {
    await prisma.calendarEvent.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete event' })
  }
}

// POST /api/calendar/sync-neis - Sync from NEIS API
export async function syncFromNeis(req, res) {
  try {
    const { fromYmd, toYmd } = req.body

    // Default: current month
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const fromDate = fromYmd || `${year}${month.toString().padStart(2, '0')}01`
    const toDate = toYmd || `${year}${month.toString().padStart(2, '0')}31`

    const result = await syncNeisToLocal(fromDate, toDate)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync from NEIS', message: error.message })
  }
}

// GET /api/calendar/neis - Get from NEIS API (without saving)
export async function getNeisEvents(req, res) {
  try {
    const { fromYmd, toYmd } = req.query

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const fromDate = fromYmd || `${year}${month.toString().padStart(2, '0')}01`
    const toDate = toYmd || `${year}${month.toString().padStart(2, '0')}31`

    const events = await getNeisCalendar(fromDate, toDate)
    res.json(events)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch NEIS calendar', message: error.message })
  }
}

// GET /api/calendar/ics/export - Export as ICS format (DB + NEIS)
export async function exportCalendarICS(req, res) {
  try {
    const { fromYmd, toYmd } = req.query

    // DB 이벤트 조회
    let where = {}
    if (fromYmd && toYmd) {
      const y1 = parseInt(fromYmd.substring(0,4)), m1 = parseInt(fromYmd.substring(4,6))-1, d1 = parseInt(fromYmd.substring(6,8))
      const y2 = parseInt(toYmd.substring(0,4)), m2 = parseInt(toYmd.substring(4,6))-1, d2 = parseInt(toYmd.substring(6,8))
      where.start = { gte: new Date(y1, m1, d1) }
      where.end = { lte: new Date(y2, m2, d2, 23, 59, 59) }
    }
    const dbEvents = await prisma.calendarEvent.findMany({ where, orderBy: { start: 'asc' } })

    // NEIS 이벤트 조회
    let neisEvents = []
    if (fromYmd && toYmd) {
      try {
        neisEvents = await getNeisCalendar(fromYmd, toYmd)
      } catch {}
    }

    // ICS 특수문자 이스케이프
    const esc = (s) => (s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

    // ICS 줄 폴딩 (75바이트 제한)
    const fold = (line) => {
      const bytes = Buffer.from(line, 'utf8')
      if (bytes.length <= 75) return line
      let result = '', offset = 0
      while (offset < bytes.length) {
        const chunk = bytes.slice(offset, offset + (offset === 0 ? 75 : 74)).toString('utf8')
        result += (offset === 0 ? '' : '\r\n ') + chunk
        offset += Buffer.from(chunk, 'utf8').length
      }
      return result
    }

    // YYYYMMDD 다음 날 계산 (전일 이벤트 DTEND는 exclusive)
    const nextDay = (ymd8) => {
      const d = new Date(
        parseInt(ymd8.substring(0,4)),
        parseInt(ymd8.substring(4,6)) - 1,
        parseInt(ymd8.substring(6,8)) + 1
      )
      return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
    }

    const formatDt = (date) => new Date(date).toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z'

    const vevents = []

    // DB 이벤트 (Date 객체)
    dbEvents.forEach(ev => {
      vevents.push([
        'BEGIN:VEVENT',
        fold(`SUMMARY:${esc(ev.title)}`),
        fold(`DTSTART:${formatDt(ev.start)}`),
        fold(`DTEND:${formatDt(ev.end)}`),
        ev.description ? fold(`DESCRIPTION:${esc(ev.description)}`) : null,
        fold(`CATEGORIES:${esc(ev.type || 'general')}`),
        `UID:db-${ev.id}@smc-gameweb`,
        'END:VEVENT'
      ].filter(Boolean).join('\r\n'))
    })

    // NEIS 이벤트 (YYYYMMDD 전일 이벤트)
    neisEvents.forEach((ev, i) => {
      const start = ev.start || ''
      const end = ev.end || ev.start || ''
      if (!start) return
      vevents.push([
        'BEGIN:VEVENT',
        fold(`SUMMARY:${esc(ev.title)}`),
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${nextDay(end)}`,
        ev.description ? fold(`DESCRIPTION:${esc(ev.description)}`) : null,
        fold(`CATEGORIES:${esc(ev.type || 'general')}`),
        `UID:neis-${start}-${i}@smc-gameweb`,
        'END:VEVENT'
      ].filter(Boolean).join('\r\n'))
    })

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SMC GameWeb//School Calendar//KO',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:세명컴고 게임과 학사일정',
      'X-WR-TIMEZONE:Asia/Seoul',
      ...vevents,
      'END:VCALENDAR'
    ].join('\r\n')

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="smc-gameweb-calendar.ics"')
    res.send(ics)
  } catch (error) {
    console.error('ICS export error:', error)
    res.status(500).json({ error: 'Failed to export calendar' })
  }
}
