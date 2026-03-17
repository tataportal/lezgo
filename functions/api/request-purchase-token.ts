import { verifyAuth } from './_lib/auth.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { generatePurchaseToken } from './_lib/purchase-token.js';
import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * POST /api/request-purchase-token
 * Body: { eventId }
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyAuth(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.GENERAL);
    if (rateLimited) return rateLimited;

    const { eventId } = await context.request.json() as any;

    if (!eventId) {
      return errorResponse('Missing eventId');
    }

    const token = generatePurchaseToken(user.uid, eventId);

    return json({ purchaseToken: token, expiresIn: 120 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate token';
    return errorResponse(message);
  }
};
