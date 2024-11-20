const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS))
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const sig = event.headers['stripe-signature'];

  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body,
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
        if (leadData.status !== 'New' || leadData.purchasedBy) {
          throw new Error('Lead is no longer available');
        }

        // Update lead
        transaction.update(leadRef, {
          status: 'Purchased',
          purchasedBy: userId,
          purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentIntentId: paymentIntent.id,
          leadStatus: 'New'
        });

        // Record payment
        const paymentRef = db.collection('payments').doc();
        transaction.set(paymentRef, {
          leadId,
          userId,
          amount: paymentIntent.amount,
          status: 'succeeded',
          paymentIntentId: paymentIntent.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    console.error('Webhook Error:', err);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` }),
    };
  }
};