import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key');
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

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { leadId, userId } = JSON.parse(event.body || '{}');

    if (!leadId || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    // Check if lead is available
    const leadRef = db.collection('leads').doc(leadId);
    const leadDoc = await leadRef.get();

    if (!leadDoc.exists) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Lead not found' })
      };
    }

    const leadData = leadDoc.data();
    if (!leadData || leadData.status !== 'New' || leadData.purchasedBy) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Lead is no longer available' })
      };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 500, // $5.00 in cents
      currency: 'usd',
      metadata: {
        leadId,
        userId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      })
    };
  } catch (err) {
    console.error('Payment intent error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: err instanceof Error ? err.message : 'Failed to create payment intent'
      })
    };
  }
};

export { handler };