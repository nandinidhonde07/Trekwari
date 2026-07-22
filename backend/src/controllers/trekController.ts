import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Utility to parse stringified JSON columns safely.
 */
function parseField(field: string, fallback: any = []) {
  try {
    return field ? JSON.parse(field) : fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Lists events with flexible search, category filters, and difficulty sorting.
 */
export async function getEvents(req: Request, res: Response) {
  const { search, type, difficulty, status, minPrice, maxPrice } = req.query;

  try {
    const now = new Date();

    // Auto-transition past events to COMPLETED status
    try {
      await prisma.event.updateMany({
        where: {
          status: { in: ['OPEN_REGISTRATION', 'UPCOMING', 'ONGOING'] },
          endDate: { lt: now },
          isDeleted: false
        },
        data: { status: 'COMPLETED' }
      });
    } catch (autoErr) {
      console.warn('Auto-complete past events non-critical notice:', autoErr);
    }

    const whereClause: any = { isDeleted: false };

    if (search) {
      whereClause.OR = [
        { title: { contains: String(search) } },
        { location: { contains: String(search) } },
        { description: { contains: String(search) } }
      ];
    }

    if (type) whereClause.type = String(type);
    if (difficulty) whereClause.difficulty = String(difficulty);
    
    // Status filter handling
    if (status) {
      if (String(status) === 'ALL') {
        // Return all non-deleted events for admin
      } else {
        whereClause.status = String(status);
      }
    } else {
      // Default public listing excludes DRAFT
      whereClause.status = { not: 'DRAFT' };
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseFloat(String(minPrice));
      if (maxPrice) whereClause.price.lte = parseFloat(String(maxPrice));
    }

    const sortOrder: any = String(status) === 'COMPLETED' ? { startDate: 'desc' } : { startDate: 'asc' };

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: sortOrder,
      include: {
        leaders: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true }
            }
          }
        }
      }
    });

    // Parse JSON string fields for frontend convenience
    const formattedEvents = events.map(event => ({
      ...event,
      highlights: parseField(event.highlights),
      thingsToCarry: parseField(event.thingsToCarry),
      safetyMeasures: parseField(event.safetyMeasures),
      pickupPoints: parseField(event.pickupPoints),
      images: parseField(event.images),
      itinerary: parseField(event.itinerary, [])
    }));

    return res.json(formattedEvents);
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({ error: 'Failed to retrieve trekking events.' });
  }
}

/**
 * Gets a single event by its slug.
 */
export async function getEventBySlug(req: Request, res: Response) {
  const { slug } = req.params;

  try {
    const event = await prisma.event.findFirst({
      where: { slug, isDeleted: false },
      include: {
        leaders: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, email: true }
            }
          }
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true }
            }
          }
        },
        faqs: true,
        policy: true
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const evt = event as any;
    const formattedEvent = {
      ...evt,
      highlights: parseField(evt.highlights),
      thingsToCarry: parseField(evt.thingsToCarry),
      safetyMeasures: parseField(evt.safetyMeasures),
      pickupPoints: parseField(evt.pickupPoints),
      images: parseField(evt.images),
      itinerary: parseField(evt.itinerary, []),
      reviews: evt.reviews.map((rev: any) => ({
        ...rev,
        images: parseField(rev.images),
        user: rev.isAnonymous ? { name: 'Anonymous', avatarUrl: null } : rev.user
      }))
    };

    return res.json(formattedEvent);
  } catch (error) {
    console.error('Get event by slug error:', error);
    return res.status(500).json({ error: 'Failed to retrieve trek details.' });
  }
}

/**
 * Creates a new event (Admin only).
 */
export async function createEvent(req: AuthRequest, res: Response) {
  const {
    title,
    slug,
    type,
    status,
    difficulty,
    altitude,
    duration,
    price,
    maxSeats,
    startDate,
    endDate,
    location,
    description,
    highlights,
    itinerary,
    thingsToCarry,
    fitnessLevel,
    safetyMeasures,
    pickupPoints,
    images,
    distance,
    elevationGain,
    meetingPoint,
    endPoint,
    googleMapsUrl,
    gpxRoute,
    trekGrade,
    suitableFor,
    minAge,
    leaderIds, // Array of user IDs to assign as leaders
    policyId,
    coordinatorName,
    coordinatorPhone,
    trekLeaderName,
    assistantLeaders,
    busNumber,
    pickupLocations,
    pickupTimings,
    weatherNotes
  } = req.body;

  try {
    // Generate slug from title if not provided
    let eventSlug = slug ? String(slug).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
    if (!eventSlug && title) {
      eventSlug = String(title).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (!eventSlug) eventSlug = `trek-${Date.now()}`;

    const existing = await prisma.event.findUnique({ where: { slug: eventSlug } });
    if (existing) {
      eventSlug = `${eventSlug}-${Date.now().toString().slice(-4)}`;
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : start;

    const newEvent = await prisma.event.create({
      data: {
        title: title || 'Untitled Trek',
        slug: eventSlug,
        type: type || 'TREK',
        status: status || 'DRAFT',
        difficulty: difficulty || 'MODERATE',
        altitude: altitude || '1000m',
        duration: duration || '1 Day',
        price: price ? parseFloat(String(price)) : 999,
        maxSeats: maxSeats ? parseInt(String(maxSeats)) : 30,
        availableSeats: maxSeats ? parseInt(String(maxSeats)) : 30,
        startDate: start,
        endDate: end,
        location: location || 'Sahyadri Range, Maharashtra',
        description: description || 'Trekking expedition with TrekWari.',
        highlights: JSON.stringify(Array.isArray(highlights) ? highlights : []),
        itinerary: JSON.stringify(Array.isArray(itinerary) ? itinerary : []),
        thingsToCarry: JSON.stringify(Array.isArray(thingsToCarry) ? thingsToCarry : []),
        fitnessLevel: fitnessLevel || 'BASIC',
        safetyMeasures: JSON.stringify(Array.isArray(safetyMeasures) ? safetyMeasures : []),
        pickupPoints: JSON.stringify(Array.isArray(pickupPoints) ? pickupPoints : []),
        images: JSON.stringify(Array.isArray(images) ? images : []),
        distance: distance ? parseFloat(String(distance)) : null,
        elevationGain: elevationGain ? parseFloat(String(elevationGain)) : null,
        meetingPoint: meetingPoint || '',
        endPoint: endPoint || '',
        googleMapsUrl: googleMapsUrl || '',
        gpxRoute: gpxRoute || null,
        trekGrade: trekGrade || null,
        suitableFor: suitableFor || null,
        minAge: minAge ? parseInt(String(minAge)) : 10,
        policyId: policyId || null,
        coordinatorName: coordinatorName || null,
        coordinatorPhone: coordinatorPhone || null,
        trekLeaderName: trekLeaderName || null,
        assistantLeaders: assistantLeaders ? JSON.stringify(assistantLeaders) : null,
        busNumber: busNumber || 'Bus 1',
        pickupLocations: pickupLocations ? JSON.stringify(pickupLocations) : null,
        pickupTimings: pickupTimings ? JSON.stringify(pickupTimings) : null,
        weatherNotes: weatherNotes || null
      }
    });

    // Assign leaders
    if (leaderIds && Array.isArray(leaderIds)) {
      for (const uid of leaderIds) {
        await prisma.eventLeader.create({
          data: {
            eventId: newEvent.id,
            userId: uid,
            role: 'LEADER'
          }
        });
      }
    }

    return res.status(201).json({
      message: 'Trekking event created successfully!',
      event: newEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ error: 'Failed to create event.' });
  }
}

/**
 * Updates an event (Admin only).
 */
export async function updateEvent(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const data = req.body;

  try {
    const currentEvent = await prisma.event.findUnique({ where: { id } });
    if (!currentEvent) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Prepare update payload
    const updateData: any = {};
    const stringFields = [
      'title', 'slug', 'type', 'status', 'difficulty', 'altitude',
      'duration', 'location', 'description', 'fitnessLevel',
      'meetingPoint', 'endPoint', 'googleMapsUrl', 'gpxRoute',
      'trekGrade', 'suitableFor', 'policyId',
      'coordinatorName', 'coordinatorPhone', 'trekLeaderName', 'busNumber', 'weatherNotes'
    ];

    stringFields.forEach(f => {
      if (data[f] !== undefined) updateData[f] = data[f];
    });

    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    if (data.minAge !== undefined) updateData.minAge = parseInt(data.minAge);
    
    if (data.distance !== undefined) updateData.distance = data.distance ? parseFloat(data.distance) : null;
    if (data.elevationGain !== undefined) updateData.elevationGain = data.elevationGain ? parseFloat(data.elevationGain) : null;

    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);

    if (data.maxSeats !== undefined) {
      const diff = parseInt(data.maxSeats) - currentEvent.maxSeats;
      updateData.maxSeats = parseInt(data.maxSeats);
      updateData.availableSeats = Math.max(0, currentEvent.availableSeats + diff);
    }

    // JSON fields
    const jsonFields = [
      'highlights', 'itinerary', 'thingsToCarry', 'safetyMeasures', 'pickupPoints', 'images',
      'assistantLeaders', 'pickupLocations', 'pickupTimings'
    ];
    jsonFields.forEach(f => {
      if (data[f] !== undefined) {
        updateData[f] = JSON.stringify(data[f]);
      }
    });

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData
    });

    // Update leaders if provided
    if (data.leaderIds && Array.isArray(data.leaderIds)) {
      // Clear old leaders
      await prisma.eventLeader.deleteMany({ where: { eventId: id } });
      // Insert new
      for (const uid of data.leaderIds) {
        await prisma.eventLeader.create({
          data: {
            eventId: id,
            userId: uid,
            role: 'LEADER'
          }
        });
      }
    }

    return res.json({
      message: 'Event updated successfully!',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({ error: 'Failed to update event.' });
  }
}

/**
 * Deletes an event (Admin only).
 */
export async function deleteEvent(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const existing = await prisma.event.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    await prisma.event.update({
      where: { id },
      data: { isDeleted: true }
    });
    return res.json({ message: 'Trekking event deleted successfully.' });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({ error: 'Failed to delete event.' });
  }
}

/**
 * Duplicates an event (Admin only).
 */
export async function duplicateEvent(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const source = await prisma.event.findUnique({
      where: { id },
      include: { leaders: true }
    });

    if (!source) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Generate unique slug and title
    let copyTitle = `Copy of ${source.title}`;
    let copySlug = `${source.slug}-copy`;
    
    let isUnique = false;
    let counter = 1;
    while (!isUnique) {
      const existing = await prisma.event.findUnique({ where: { slug: copySlug } });
      if (!existing) {
        isUnique = true;
      } else {
        copySlug = `${source.slug}-copy-${counter}`;
        copyTitle = `Copy of ${source.title} (${counter})`;
        counter++;
      }
    }

    const copy = await prisma.event.create({
      data: {
        title: copyTitle,
        slug: copySlug,
        type: source.type,
        status: 'DRAFT', // Duplicate starts as draft
        difficulty: source.difficulty,
        altitude: source.altitude,
        duration: source.duration,
        price: source.price,
        maxSeats: source.maxSeats,
        availableSeats: source.maxSeats,
        startDate: source.startDate,
        endDate: source.endDate,
        location: source.location,
        description: source.description,
        highlights: source.highlights,
        itinerary: source.itinerary,
        thingsToCarry: source.thingsToCarry,
        fitnessLevel: source.fitnessLevel,
        safetyMeasures: source.safetyMeasures,
        pickupPoints: source.pickupPoints,
        images: source.images,
        distance: source.distance,
        elevationGain: source.elevationGain,
        meetingPoint: source.meetingPoint,
        endPoint: source.endPoint,
        googleMapsUrl: source.googleMapsUrl,
        gpxRoute: source.gpxRoute,
        trekGrade: source.trekGrade,
        suitableFor: source.suitableFor,
        minAge: source.minAge,
        policyId: source.policyId
      }
    });

    // Copy event leaders
    for (const leader of source.leaders) {
      await prisma.eventLeader.create({
        data: {
          eventId: copy.id,
          userId: leader.userId,
          role: leader.role
        }
      });
    }

    return res.status(201).json({
      message: 'Event duplicated successfully!',
      event: copy
    });
  } catch (error) {
    console.error('Duplicate event error:', error);
    return res.status(500).json({ error: 'Failed to duplicate event.' });
  }
}
