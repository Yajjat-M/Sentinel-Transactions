import { z } from 'zod';
import { insertTransactionSchema, insertAlertSchema, insertInvestigationSchema } from './schema';

export const api = {
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions',
      input: z.object({
        status: z.string().optional(),
        minRisk: z.string().optional(), // numeric string
        limit: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.any()), // Transaction[] - using z.any() to avoid circular type issues in complex schemas, typically we'd use z.custom<Transaction>
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/transactions/:id',
      responses: {
        200: z.any(), // Transaction
        404: z.object({ message: z.string() }),
      },
    },
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.object({
          totalTransactions: z.number(),
          failureRate: z.number(),
          avgRiskScore: z.number(),
          activeInvestigations: z.number(),
          blockedCount: z.number(),
          fraudSpikeDetected: z.boolean(),
        }),
      },
    },
  },
  alerts: {
    list: {
      method: 'GET' as const,
      path: '/api/alerts',
      responses: {
        200: z.array(z.any()), // Alert[]
      },
    },
  },
  investigations: {
    list: {
      method: 'GET' as const,
      path: '/api/investigations',
      responses: {
        200: z.array(z.any()), // Investigation[]
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/investigations',
      input: z.object({
        transactionId: z.string(),
        reason: z.string(),
      }),
      responses: {
        201: z.any(), // Investigation
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/investigations/:id',
      input: z.object({
        status: z.enum(['RESOLVED', 'BLOCKED']),
        outcome: z.string().optional(),
      }),
      responses: {
        200: z.any(), // Investigation
        404: z.object({ message: z.string() }),
      },
    },
  },
  blocked: {
    list: {
      method: 'GET' as const,
      path: '/api/blocked',
      responses: {
        200: z.array(z.any()), // Transaction[]
      },
    },
  },
  agent: {
    status: {
      method: 'GET' as const,
      path: '/api/agent/status',
      responses: {
        200: z.object({
          currentPhase: z.string(),
          lastRun: z.string(),
          isRunning: z.boolean(),
          logs: z.array(z.any()), // AgentLog[]
        }),
      },
    },
  },
  reset: {
    method: 'POST' as const,
    path: '/api/reset',
    responses: {
      200: z.object({ message: z.string() }),
    },
  },
  simulate: {
    method: 'POST' as const,
    path: '/api/simulate',
    input: z.object({
      scenario: z.enum(['fraud_attack', 'bank_outage']),
    }),
    responses: {
      200: z.object({ message: z.string() }),
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
