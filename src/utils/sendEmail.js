/**
 * Send email using Brevo API (formerly Sendinblue)
 * Free plan: 300 emails/day, no credit card required
 * Works with Render (no SMTP port blocking)
 */

const axios = require('axios');

const sendEmail = async (options) => {
    // Check if email service is configured
    if (!process.env.BREVO_API_KEY) {
        console.log('📧 Mock Email (Brevo not configured):');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        return;
    }

    try {
        // Brevo API endpoint for sending emails
        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: {
                    name: process.env.FROM_NAME || 'Ecommerce API',
                    email: process.env.FROM_EMAIL || 'noreply@ecommerce.com'
                },
                to: [
                    {
                        email: options.email,
                        name: options.name || 'User'
                    }
                ],
                subject: options.subject,
                htmlContent: options.message, // Brevo supports HTML content
                textContent: options.message.replace(/<[^>]*>/g, '') // Strip HTML for plain text
            },
            {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✅ Email sent successfully to ${options.email}`);
        console.log(`Message ID: ${response.data.messageId}`);
        return response.data;

    } catch (error) {
        console.error('❌ Email sending error:', error.response?.data || error.message);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

module.exports = sendEmail;
