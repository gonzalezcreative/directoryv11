import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing Stripe webhook secret');
}

if (!process.env.FIREBASE_ADMIN_CREDENTIALS) {
  throw new Error('Missing Firebase admin credentials');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Initialize Firebase Admin
if (!getFirestore().projectId) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS))
  });
}

const db = getFirestore();

const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const sig = event.headers['stripe-signature'];

  if (!sig) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing stripe signature' })
    };
  }

  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body || '',
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (stripeEvent.type === 'payment_intent.succeeded') {
      const paymentIntent = stripeEvent.data.object;
      const { leadId, userId } = paymentIntent.metadata;

      // Update lead in Firestore using transaction
      await db.runTransaction(async (transaction) => {
        const leadRef = db.collection('leads').doc(leadId);
        const leadDoc = await transaction.get(leadRef);

        if (!leadDoc.exists) {
          throw new Error('Lead not found');
        }

        const leadData = leadDoc.data();
        if (!leadData || leadData.status !== 'New' || leadData.purchasedBy) {
          throw new Error('Lead is no longer available');
        }

        // Update lead
        transaction.update(leadRef, {
          status: 'Purchased',
          purchasedBy: userId,
          purchasedAt: FieldValue.serverTimestamp(),
          paymentIntentId: paymentIntent.id
        });

        // Record payment
        const paymentRef = db.collection('payments').doc();
        transaction.set(paymentRef, {
          leadId,
          userId,
          amount: paymentIntent.amount,
          status: 'succeeded',
          paymentIntentId: paymentIntent.id,
          createdAt: FieldValue.serverTimestamp()
        });
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
  } catch (err) {
    console.error('Webhook Error:', err);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: err instanceof Error ? err.message : 'Webhook processing failed'
      })
    };
  }
};

export { handler };