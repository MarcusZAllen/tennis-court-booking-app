import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, pageUrl, timestamp } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'CourtBook Feedback <onboarding@resend.dev>', // Using Resend's test domain (works immediately)
      to: ['marcus.zhang.allen@gmail.com'],
      subject: 'New Feedback from CourtBook',
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><strong>Page URL:</strong> ${pageUrl}</p>
        <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email', details: error });
    }

    console.log('Feedback email sent:', data);
    return res.status(200).json({ success: true, messageId: data?.id });

  } catch (error: any) {
    console.error('Error sending feedback:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

