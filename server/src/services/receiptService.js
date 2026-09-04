import { Resend } from 'resend';
import * as orderService from './orderService.js';
import logger from '../utils/logger.js';

let resendClient = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Generate a responsive, styled HTML receipt for an order
 */
function buildReceiptHtml(order) {
  const activeLines = (order.lines || []).filter((l) => !l.voided);
  const voidedLines = (order.lines || []).filter((l) => l.voided);
  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString();

  const activeRows = activeLines
    .map(
      (line) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px;">
          <strong>${line.menu_item_name}</strong>
          ${
            line.special_instructions
              ? `<div style="font-size: 12px; color: #64748b; font-style: italic;">Note: ${line.special_instructions}</div>`
              : ''
          }
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: center; color: #475569; font-size: 14px;">
          ${line.quantity}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #475569; font-size: 14px;">
          ₹${Number(line.unit_price).toFixed(2)}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a; font-size: 14px;">
          ₹${(Number(line.unit_price) * line.quantity).toFixed(2)}
        </td>
      </tr>
    `,
    )
    .join('');

  const voidedRows = voidedLines
    .map(
      (line) => `
      <tr style="color: #94a3b8; text-decoration: line-through;">
        <td style="padding: 8px 0; border-bottom: 1px solid #f8fafc; font-size: 13px;">
          ${line.menu_item_name} (Voided)
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f8fafc; text-align: center; font-size: 13px;">
          ${line.quantity}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f8fafc; text-align: right; font-size: 13px;">
          ₹${Number(line.unit_price).toFixed(2)}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f8fafc; text-align: right; font-size: 13px;">
          ₹0.00
        </td>
      </tr>
    `,
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt for Table #${order.table_number}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 28px 24px; text-align: center;">
      <h1 style="color: #f97316; margin: 0 0 6px 0; font-size: 24px; letter-spacing: -0.5px;">Corkless</h1>
      <p style="color: #94a3b8; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;">Official Dining Receipt</p>
    </div>

    <!-- Details -->
    <div style="padding: 24px; border-bottom: 1px dashed #cbd5e1;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748b; font-size: 13px;">Table:</span>
        <strong style="color: #0f172a; font-size: 14px;">#${order.table_number}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748b; font-size: 13px;">Date & Time:</span>
        <span style="color: #0f172a; font-size: 13px;">${formattedDate}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748b; font-size: 13px;">Primary Server:</span>
        <span style="color: #0f172a; font-size: 13px;">${order.primary_waiter_name || 'Staff'}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748b; font-size: 13px;">Order ID:</span>
        <span style="color: #64748b; font-size: 12px; font-family: monospace;">${order.id.slice(0, 8)}</span>
      </div>
    </div>

    <!-- Items Table -->
    <div style="padding: 24px;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px; text-transform: uppercase;">
            <th style="padding-bottom: 8px;">Item</th>
            <th style="padding-bottom: 8px; text-align: center;">Qty</th>
            <th style="padding-bottom: 8px; text-align: right;">Price</th>
            <th style="padding-bottom: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${activeRows}
          ${voidedRows}
        </tbody>
      </table>

      <!-- Total -->
      <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #0f172a; display: flex; justify-content: space-between; align-items: baseline;">
        <span style="font-size: 16px; font-weight: 700; color: #0f172a;">Total Amount</span>
        <span style="font-size: 22px; font-weight: 800; color: #f97316;">₹${Number(order.total || 0).toFixed(2)}</span>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #334155;">Thank you for dining with us!</p>
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">Corkless Restaurant Operations • Powered by Resend</p>
    </div>

  </div>
</body>
</html>
  `;
}

/**
 * Send an email receipt for a specified order via Resend
 */
export async function sendOrderReceipt(orderId, customerEmail, user) {
  const order = await orderService.getOrder(orderId);
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const htmlContent = buildReceiptHtml(order);
  const subject = `Your Dining Receipt — Table #${order.table_number} (${new Date().toLocaleDateString('en-IN')})`;

  if (resend) {
    logger.info(`Sending receipt for order ${orderId} to ${customerEmail} via Resend`);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject,
      html: htmlContent,
    });

    if (error) {
      logger.error('Resend delivery error:', error);
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    }

    logger.info(`Receipt successfully sent via Resend: ${data?.id}`);
  } else {
    logger.warn(
      `RESEND_API_KEY is not configured. Simulating receipt email send for order ${orderId} to ${customerEmail}.`,
    );
  }

  // Record action into the immutable audit timeline
  await orderService.addNote(
    orderId,
    `Receipt emailed to ${customerEmail}`,
    user,
  );

  return {
    success: true,
    message: `Receipt successfully sent to ${customerEmail}`,
    simulated: !resend,
  };
}
