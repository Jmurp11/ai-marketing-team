/**
 * RinkLink.ai Unified Email Template
 *
 * Ported from rinklink-emailer/apps/api/src/email/email.template.ts
 *
 * Brand colors:
 *   Primary: #0c4066 (dark blue - header)
 *   Secondary: #f0622b (orange - buttons, accents)
 *
 * Font stack: Space Grotesk, Noto Sans, sans-serif
 */

const COLORS = {
  primary: '#0c4066',
  secondary: '#f0622b',
  white: '#ffffff',
  lightGray: '#f5f5f5',
  mediumGray: '#718096',
  darkGray: '#333333',
  borderGray: '#e2e8f0',
};

const FONT_STACK = "'Space Grotesk', 'Noto Sans', sans-serif !important";
const BODY_FONT_STACK = "'Space Grotesk', 'Noto Sans', sans-serif !important";

/**
 * Build a styled CTA button.
 * @param {string} text
 * @param {string} href
 * @param {'primary'|'outline'} variant
 */
function buildButton(text, href, variant = 'primary') {
  const isPrimary = variant === 'primary';
  const styles = isPrimary
    ? `background-color: ${COLORS.secondary}; color: ${COLORS.white}; border: 2px solid ${COLORS.secondary};`
    : `background-color: ${COLORS.white}; color: ${COLORS.secondary}; border: 2px solid ${COLORS.secondary};`;

  return `
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="10%" ${isPrimary ? `fillcolor="${COLORS.secondary}"` : 'fill="false"'} ${isPrimary ? '' : `strokecolor="${COLORS.secondary}"`} strokeweight="2px">
      <w:anchorlock/>
      <center style="color:${isPrimary ? COLORS.white : COLORS.secondary};font-family:${BODY_FONT_STACK};font-size:16px;font-weight:600;">${text}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 24px auto;">
      <tr>
        <td style="border-radius: 6px; ${styles}">
          <a href="${href}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: ${BODY_FONT_STACK}; font-size: 16px; font-weight: 600; text-decoration: none; ${styles} border-radius: 6px; text-align: center;">${text}</a>
        </td>
      </tr>
    </table>
    <!--<![endif]-->
  `.trim();
}

/**
 * Build the complete branded HTML email.
 * @param {object} params
 * @param {string} params.subject
 * @param {string} params.body - HTML body content
 * @param {string} [params.preheader]
 * @param {string} [params.footerText]
 * @param {boolean} [params.hideHeader]
 */
function buildEmailHtml(params) {
  const {
    subject,
    body,
    preheader = '',
    footerText,
    hideHeader = false,
  } = params;

  const currentYear = new Date().getFullYear();
  const defaultFooterText = `&copy; ${currentYear} RINKLINKAI LLC. All rights reserved.`;

  const preheaderHtml = preheader
    ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>
       <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : '';

  const headerHtml = hideHeader
    ? ''
    : `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${COLORS.primary}" style="background-color: ${COLORS.primary}; border-radius: 8px 8px 0 0;">
      <tr>
        <td align="center" bgcolor="${COLORS.primary}" style="padding: 30px 20px; background-color: ${COLORS.primary};">
          <a href="https://rinklink.ai" style="text-decoration: none; font-family: ${FONT_STACK}; font-size: 28px; font-weight: 700;">
            <span style="color: ${COLORS.white};">RinkLink</span><span style="color: ${COLORS.secondary};">.ai</span>
          </a>
        </td>
      </tr>
    </table>
  `;

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, address=no, email=no, date=no, url=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    table { border-collapse: collapse; }
    td, th, div, p, a, h1, h2, h3, h4, h5, h6 { font-family: ${BODY_FONT_STACK}; }
  </style>
  <![endif]-->
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap");
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
    }
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
      }
      .content-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.lightGray}; font-family: ${BODY_FONT_STACK};">
  ${preheaderHtml}

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="${COLORS.lightGray}" style="background-color: ${COLORS.lightGray};">
    <tr>
      <td align="center" style="padding: 20px 10px;">

        <!--[if mso]>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center">
        <tr>
        <td>
        <![endif]-->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 600px; margin: 0 auto;" class="container">

          <tr>
            <td>
              ${headerHtml}
            </td>
          </tr>

          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${COLORS.white}" style="background-color: ${COLORS.white}; ${hideHeader ? 'border-radius: 8px;' : 'border-radius: 0 0 8px 8px;'}">
                <tr>
                  <td bgcolor="${COLORS.white}" style="padding: 30px 40px; background-color: ${COLORS.white};" class="content-padding">
                    <div style="font-family: ${BODY_FONT_STACK}; font-size: 16px; line-height: 1.6; color: ${COLORS.darkGray}; max-width: 520px; word-wrap: break-word; overflow-wrap: break-word;">
                      ${body}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <p style="margin: 0; padding: 0; font-family: ${BODY_FONT_STACK}; font-size: 12px; line-height: 1.5; color: ${COLORS.mediumGray};">
                ${footerText || defaultFooterText}
              </p>
            </td>
          </tr>

        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

/**
 * Build plain text email fallback.
 * @param {object} params
 * @param {string} params.subject
 * @param {string} params.body
 */
function buildEmailText(params) {
  const { subject, body } = params;
  const currentYear = new Date().getFullYear();

  return `
${subject}

${body}

---
(c) ${currentYear} RinkLink.ai. All rights reserved.
  `.trim();
}

/**
 * Normalize body font — strip existing font-family declarations and apply brand font.
 * Ported from email.service.ts normalizeBodyFont().
 * @param {string} html
 */
function normalizeBodyFont(html) {
  const font = "'Space Grotesk', 'Noto Sans', sans-serif";
  let cleaned = html.replace(/font-family\s*:[^;"']*/gi, '');
  cleaned = cleaned.replace(/style="\s*;?\s*"/gi, '');
  const blockTags = ['p', 'div', 'li', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'td'];
  for (const tag of blockTags) {
    cleaned = cleaned.replace(
      new RegExp(`<${tag}(\\s[^>]*)style="`, 'gi'),
      `<${tag}$1style="font-family: ${font}; `,
    );
    cleaned = cleaned.replace(
      new RegExp(`<${tag}(\\s[^>]*)(?<!style=")>`, 'gi'),
      `<${tag}$1 style="font-family: ${font};">`,
    );
    cleaned = cleaned.replace(
      new RegExp(`<${tag}>`, 'gi'),
      `<${tag} style="font-family: ${font};">`,
    );
  }
  return cleaned;
}

module.exports = {
  COLORS,
  FONT_STACK,
  BODY_FONT_STACK,
  buildButton,
  buildEmailHtml,
  buildEmailText,
  normalizeBodyFont,
};
