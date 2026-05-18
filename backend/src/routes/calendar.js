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

// GET /api/calendar/ics - Export as ICS format
export async function exportCalendarICS(req, res) {
  try {
    const events = await prisma.calendarEvent.findMany({
      orderBy: { start: 'asc' }
    })

    const formatDate = (date) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GameWeb//Department Site//KO',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...events.map(event => [
        'BEGIN:VEVENT',
        `DTSTART:${formatDate(event.start)}`,
        `DTEND:${formatDate(event.end)}`,
        `SUMMARY:${event.title}`,
        event.description ? `DESCRIPTION:${event.description}` : '',
        `CATEGORIES:${event.type}`,
        `UID:${event.id}@gameweb`,
        'END:VEVENT'
      ].join('\n')),
      'END:VCALENDAR'
    ].join('\n')

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="gameweb-calendar.ics"')
    res.send(icsContent)
  } catch (error) {
    res.status(500).json({ error: 'Failed to export calendar' })
  }
}
