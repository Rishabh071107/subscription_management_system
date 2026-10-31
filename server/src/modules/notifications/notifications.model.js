import prisma from '../../config/db.js';

export const createNotification = async (data) => {
  return prisma.notification.create({
    data: {
      userId: data.userId || null,
      recipient: data.recipient,
      type: data.type,
      subject: data.subject,
      body: data.body || null,
      status: data.status || 'PENDING',
      sentAt: data.sentAt || null,
      metadata: data.metadata ? (typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata)) : null
    }
  });
};

export const findNotifications = async ({
  skip = 0,
  take = 10,
  userId,
  recipient,
  type,
  status,
  search
}) => {
  const where = {};

  if (userId) {
    where.userId = userId;
  }

  if (recipient) {
    where.recipient = { contains: recipient, mode: 'insensitive' };
  }

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  if (search && search.trim() !== '') {
    where.OR = [
      { subject: { contains: search.trim(), mode: 'insensitive' } },
      { recipient: { contains: search.trim(), mode: 'insensitive' } },
      { type: { contains: search.trim(), mode: 'insensitive' } }
    ];
  }

  const [total, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    })
  ]);

  return { total, notifications };
};

export const findNotificationById = async (id) => {
  return prisma.notification.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    }
  });
};

export const updateNotificationStatus = async (id, { status, sentAt, metadata }) => {
  return prisma.notification.update({
    where: { id },
    data: {
      status,
      sentAt,
      ...(metadata && { metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata) })
    }
  });
};

