//! Default Compute@Edge template program.

/// <reference types="@fastly/js-compute" />
// import { CacheOverride } from "fastly:cache-override";
// import { Logger } from "fastly:logger";
import { env } from "fastly:env";
import { includeBytes } from "fastly:experimental";
import FormData from "form-data";
// Load a static file as a Uint8Array at compile time.
// File path is relative to root of project, not to this file
const form = includeBytes("./src/index.html");


addEventListener("fetch", (event) => {
	event.respondWith(handleRequest(event))
});
async function handleRequest(event) {
	// Log service version
	console.log("FASTLY_SERVICE_VERSION:", env('FASTLY_SERVICE_VERSION') || 'local');

	// Get the client request.
	let req = event.request;

	// Filter requests that have unexpected methods.
	if (["DELETE"].includes(req.method)) {
	return new Response("This method is not allowed", {
	  status: 405,
	});
	}

	let url = new URL(req.url);

// If request is to the `/` path...
	if (url.pathname == "/") {

    // Send the html page in index.html.
	if (req.method === 'GET') {
	    return new Response(form, {
	      status: 200,
	      headers: new Headers({ "Content-Type": "text/html; charset=utf-8" }),
	    });

	//When a response to that page is received, it'll be a post. populate the new page with the user info
	} else if (req.method === 'POST') {
	    const formData = await parseFormData(await req.text());
	    const newPageContent = generateNewPage(formData);

	    return new Response(newPageContent, {
	        status: 200,
	        headers: {
	            'Content-Type': 'text/html',
	        },
	    });
	} else {
	        return new Response('Method not allowed, hit POST', { status: 405 });
    }
}

//Grab and use the form data from the user provided into the index.html page
function parseFormData(formDataText) {
    const data = {};
    const formFields = formDataText.split('&');
    for (const field of formFields) {
        const [fieldName, fieldValue] = field.split('=');
        data[decodeURIComponent(fieldName)] = decodeURIComponent(fieldValue);
    }
    return data;
}

//The HTML for the response page.
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
        <h1>Generated Shielding/Fallback/Geosteering VCL</h1>
        <body><strong>Output code should always be checked to see if it works, try using <a href="https://fiddle.fastly.dev/">fiddle</a> to verify.</strong></body>
        <h2>Place these in INIT as a VCL snippet</h2>
		    <pre>
sub director{ 
	if (server.region == "${formData.geo1}"){ 
	set req.backend = ${formData.backend1}; 
	} 

	if (backend.${formData.backend1}.healthy == false){ 
	set req.backend = ${formData.backend2}; 
	} 

	if (server.region == "${formData.geo2}"){ 
	set req.backend = ${formData.backend2};
	} 
	if (backend.${formData.backend2}.healthy == false){ 
	set req.backend = ${formData.backend1}; 
	} 

	if (server.region != "${formData.geo1}" && server.region != "${formData.geo2}"){ 
	set req.backend = ${formData.backend1}; 
	} 

	if (backend.${formData.backend1}.healthy == false){ 
	set req.backend = ${formData.backend2}; 
	} 
}
		    </pre>
		</body>
		<body>
<h2>Set this in VCL_RECV as a VCL snippet</h2>
		<pre>
if( req.url.path ~ "^/url/example/" ) { //alter this condition to match the desired url path the director is called in or remove if not needed
call director; 
} 
			</pre>
		</body>
        <body>
            <h1>Entered Form Data</h1>
            <p>First backend: ${formData.backend1}</p>
            <p>Second backend: ${formData.backend2}</p>
            <p>Primary Geo location: ${formData.geo1}</p>
            <p>Secondary Geo location: ${formData.geo2}</p>
        </body>
        </html>
    `;


  // Catch all other requests and return a 404.
  return new Response("The page you requested could not be found", {
    status: 404,
  });
}
}
