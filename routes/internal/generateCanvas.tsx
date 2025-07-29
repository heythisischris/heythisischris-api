import React from 'react';
import { renderToString } from 'react-dom/server';
import fetch from 'node-fetch';
import FormData from 'form-data';

export const generateCanvas = async () => {
  // const html = `
  //   <!DOCTYPE html>
  //   <html>
  //     <head>
  //       <meta charset="UTF-8">
  //       <script src="https://cdn.tailwindcss.com"></script>
  //     </head>
  //     <body>
  //       ${renderToString(
  //   <div className="w-full h-64 bg-white flex flex-col items-center justify-center">
  //     <div className="w-40 h-40 bg-red-400 rounded-full mb-5"></div>
  //     <div className="text-2xl font-semibold">Hello from Lambda!</div>
  //   </div>
  // )}
  //     </body>
  //   </html>
  // `;
  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        .container { 
          width: 100%;
          height: 16rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;
        }
        .circle {
          width: 10rem;
          height: 10rem;
          border-radius: 9999px;
          background: #f87171;
          margin-bottom: 1.25rem;
        }
        .text {
          font-size: 1.5rem;
          font-weight: 600;
          font-family: system-ui;
        }
      </style>
    </head>
    <body>
      ${renderToString(
    <div className="container">
      <div className="circle"></div>
      <div className="text">Japan</div>
    </div>
  )}
    </body>
  </html>
`;

  try {
    const form = new FormData();
    form.append('files', Buffer.from(html), { filename: 'index.html', contentType: 'text/html' });
    form.append('width', '800');
    form.append('height', '256');

    const response = await fetch('https://gotenberg.heythisischris.com/forms/chromium/screenshot/html', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    if (!response.ok) throw new Error(`Gotenberg error: ${response.statusText}`);

    const buffer = await response.buffer();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};