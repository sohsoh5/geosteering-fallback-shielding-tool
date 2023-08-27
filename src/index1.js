//This example uses the index1.html and requires hosting the index on a server, then manipulates it here. unsure how

/// <reference types="@fastly/js-compute" />
// import { CacheOverride } from "fastly:cache-override";
// import { Logger } from "fastly:logger";
import { env } from "fastly:env";
import { includeBytes } from "fastly:experimental";
import FormData from "form-data";
// Load a static file as a Uint8Array at compile time.
// File path is relative to root of project, not to this file
const form = includeBytes("./src/index.html");


addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    if (request.method === 'POST') {
        const formData = await parseFormData(request);
        const newPageContent = generateNewPage(formData);

        return new Response(newPageContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
            },
        });
    } else {
        return new Response('Method not allowed', { status: 405 });
    }
}

async function parseFormData(request) {
    const formData = await request.formData();
    const data = {};
    for (const entry of formData.entries()) {
        data[entry[0]] = entry[1];
    }
    return data;
}

function generateNewPage(formData) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Page with Form Data</title>
        </head>
        <body>
            <h1>New Page</h1>
            <p>Name: ${formData.name}</p>
            <p>Email: ${formData.email}</p>
        </body>
        </html>
    `;
}
