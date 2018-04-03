// this server has code to rebuild a page when it is requested. code from this server should not be copied to the aws lambda.

const http = require("http");
const { extname, normalize } = require("path");
const { stat, createReadStream } = require("fs");
const colors = require('colors');
const { buildIndex, buildPost, buildAppendix } = require("./builder.js");

const port = process.env.port;
const mimeTypes = {
    html: "text/html",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    js: "text/javascript",
    css: "text/css",
    svg: "image/svg+xml",
    txt: "text/plain",
    xml: {
        sitemap: "application/xml",
        rss: "application/rss+xml"
    },
    ggb: "application-x/geogebra-file"
};
const defaultSubject = process.env.defaultSubject;

let isAlphaNumericRegex  = /^\/[0-9A-Za-z]+$/; // /about, /review, /etc
let isPostRegex = /^\/[0-9]+\/(algebra|trigonometry|calculus|vector-calculus|statistics|linear-algebra)$/;
let isAppendixRegex = /^\/appendix\/(algebra|trigonometry|calculus|vector-calculus|statistics|linear-algebra)$/;
let isGlossaryRegex = /^\/glossary\/(algebra|trigonometry|calculus|vector-calculus|statistics|linear-algebra)$/;

let isPostReviewRegex = /\/[0-9]+\/(algebra|trigonometry|calculus|vector-calculus|statistics|linear-algebra)\/review$/;
let isAppendixReviewRegex = /\/[0-9]+\/appendix\/(algebra|trigonometry|calculus|vector-calculus|statistics|linear-algebra)\/review$/;

const serveFile = (filePath, req, res) => {
    stat(filePath, err => {
        if(err) {
            serve404(req, res);
        }
        else {
            let ext = extname(filePath).split(".")[1];
            let mimeType = "";
            if(ext !== "xml") {
                mimeType = mimeTypes[ext];
            }
            else {
                let fileName = filePath.split("/").pop().replace(`.${ext}`, "");
                mimeType = mimeTypes.xml[fileName];
            }
            res.setHeader("Content-Type", mimeType);
            res.statusCode = 200;
            createReadStream(filePath).pipe(res);
        }
    });
}

const serve404 = (req, res) => {
    console.log(`404: ${req.url} not found`);
    res.writeHead(404, mimeTypes.html);
    let _404Path = `${process.env.buildDir}/404.html`;
    createReadStream(_404Path).pipe(res);
}

const handleFileRequest = (req, res) => {
    let urn = req.url;    
    let filePath = `${process.env.publicDir}${normalize(urn)}`;

    if(urn === "/") {
        buildIndex();
        filePath = `${process.env.publicDir}/index.html`;
    }
    else if(urn.endsWith("/")){
        res.writeHead(302, {
            "Location": urn.replace(/\/$/, "")
        });
        res.end();
        return;
    }
    else if(/^\/[0-9]+$/.test(urn)) {
        res.writeHead(302, {
            "Location": `${urn}/${defaultSubject}`
        });
        res.end();
        return;
    }
    else if(
        isAlphaNumericRegex.test(urn) ||
        isPostRegex.test(urn) ||
        isAppendixRegex.test(urn) ||
        isGlossaryRegex.test(urn)) {
          
        if(process.env.buildOnRequest) {
            rebuild(urn);  
        }
        
        let subjectPath = urn.replace(/\//, "");
        subjectPath = subjectPath.replace(/\//, ".");
        subjectPath = subjectPath.replace(/-/g, "_");
        filePath = `${process.env.publicDir}/build/${subjectPath}.html`;
    }
    else if (/favicon\.png$/.test(urn)) {
        filePath = `${process.env.publicDir}/images/favicon.png`;
    }
    else if(
        urn === "/sitemap.xml" ||
        urn === "/rss.xml"
    ) {
        filePath = `${process.env.publicDir}/build${urn}`
    }
    else if(
        isPostReviewRegex.test(urn) || 
        isAppendixReviewRegex.test(urn)) {
            
        if(process.env.buildOnRequest) {
            rebuild(urn);  
        }

        filePath = `${process.env.publicDir}/build/${urn.replace("/", "").replace(/\//g, ".").replace(/-/g, "_")}.html`;
    }

    console.log(filePath);
    serveFile(filePath, req, res);
}

const rebuild = urn => {
    urn = urn.replace(/-/g, "_");

    rebuildAlphaNumeric(urn);
    rebuildPost(urn);
    rebuildAppendix(urn);
    rebuildGlossary(urn);
};

const rebuildAlphaNumeric = urn => {
    if(isAlphaNumericRegex.test(urn)) {
        console.log(`${urn} does not rebuild.`.yellow);
    }
};

const rebuildPost = urn => {
    if(isPostRegex.test(urn) || isPostReviewRegex.test(urn)) {
        let postNumber = parseInt(/\d+/.exec(urn)[0], 10);
        let subject = /[a-z]+/.exec(urn)[0];
        buildPost(postNumber, subject);
    }
};

const rebuildAppendix = urn => {
    if(isAppendixRegex.test(urn) || isAppendixReviewRegex.test(urn)) {
        let postNumber = /\d+/.exec(urn);
        postNumber = postNumber ? parseInt(postNumber[0], 10) : null;
        let subject = /\/(appendix)*\/[a-z]+/.exec(urn)[0].replace("appendix", "").replace(/\//g, "");
        buildAppendix(postNumber, subject); 
    }
};

const rebuildGlossary = urn => {
    if(isGlossaryRegex.test(urn)) {
        console.log(`${urn} does not rebuild.`.yellow);
    }
};

const start = () => {
    let server = http.createServer(handleFileRequest);
    server.listen(port, (err) => {
        if(err) {
            throw err;
        }
        console.log(`server is listening on ${port}`);
    });
};

module.exports = {
    start: start
};