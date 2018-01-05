const http = require("http");
const { extname, normalize } = require("path");
const { stat, createReadStream } = require("fs");

const port = 8080;
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
    }
};
const defaultSubject = process.env.defaultSubject;

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
    res.writeHead(404, {"Content-Type": "text/plain"});        
    res.write("404 Not Found");
    res.end();
}

const handleFileRequest = (req, res) => {
    let urn = req.url;    
    let filePath = `${process.env.publicDir}${normalize(urn)}`;

    if(urn === "/") {
        filePath = `${process.env.publicDir}/index.html`;
    }
    else if(/^\/[0-9]+$/.test(urn)) {
        res.writeHead(302, {
            "Location": `${urn}/${defaultSubject}`
        });
        res.end();
        return;
    }
    else if(
        /^\/[0-9A-Za-z]+$/.test(urn) ||
        /^\/[0-9]+\/(algebra|trigonometry|calculus|vector-calculus|statistics|linear-algebra)$/.test(urn) ||
        /^\/glossary\/(algebra|trigonometry|calculus|vector-calculus|statistics|linear-algebra)$/.test(urn) ||
        /^\/appendix\/(algebra|trigonometry|calculus|vector-calculus|statistics|linear-algebra)$/.test(urn)) {
            
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
    else if (urn === "/triangle-generator") {
        console.log("DID THE MATCH")
        filePath = `${process.env.publicDir}/utilities/triangle_generator.html`;
    }

    console.log(filePath);
    serveFile(filePath, req, res);
}

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