const { readFileSync, writeFileSync, watchFile, unwatchFile, mkdirSync } = require("fs");
const { normalize, sep} = require("path");
const compressor = require("node-minify");
const { existsSync, getDirectories, deleteFilesFromDirectory, getPostNumbers, getLargestPostNumber, getFiles, getFilesRecursively, isDev, getPostSubjects, getGlossarySubjects, getAppendixSubjects, getRandomInt, capatalizeFirstLetterOfEveryWord } = require("./utilities.js");
const zlib = require('zlib');
const { minify } = require("html-minifier");
const cheerio = require('cheerio');
const stripDebug = require('strip-debug');

const jsMinifier = "uglifyjs";
const cssMinifier = "clean-css";

const siteJavaScriptPath = `${process.env.buildDir}/site.js`;
const siteJavaScriptPathMin = `${process.env.buildDir}/site.min.js`;
const siteCSSPath = `${process.env.buildDir}/site.css`;
const siteCSSPathMin = `${process.env.buildDir}/site.min.css`;
const siteHTMLPath = `${process.env.buildDir}/site.master.html`;

const description = "Practice Problems for Algebra, Trigonometry, Calculus, Vector Calculus, Statistics, and Linear Algebra";
const shortDescription = "Regression Buddy - Math Practice Problems";

const createOrCleanBuildDirectory = () => {
    if (!existsSync(process.env.buildDir)){
        mkdirSync(process.env.buildDir);
    }
    deleteFilesFromDirectory(process.env.buildDir);
};

const integrateSiteJavaScript = () => {
    let js = [
        `${process.env.clientDir}/scripts/modernizer.js`,
        `${process.env.clientDir}/scripts/utilities.js`,
        `${process.env.clientDir}/scripts/master.js`
    ].map(path => readFileSync(path)).join("\r\n");
    writeFileSync(siteJavaScriptPath, js);
};

const minimizeSiteJavaScript = () => {
    compressor.minify({
        compressor: jsMinifier,
        input: siteJavaScriptPath,
        output: siteJavaScriptPathMin,
        sync: true
    });
    // couldn't get ^this to strip console.log. so used stripDebug...
    writeFileSync(siteJavaScriptPathMin, stripDebug(readFileSync(siteJavaScriptPathMin).toString()));
};

const integrateSiteCSS = () => {
    let css = [
        `${process.env.clientDir}/styles/master.css`,
        `${process.env.clientDir}/styles/badge_outline.css`
    ].map(path => readFileSync(path)).join("\r\n");
    writeFileSync(siteCSSPath, css);
};

const minimizeSiteCSS = () => {
    compressor.minify({
        compressor: cssMinifier,
        input: siteCSSPath,
        output: siteCSSPathMin,
        sync: true
    });
};

const buildMasterPage = () => {
    let generalPath = normalize(`${process.env.clientDir}/html`);
    let masterPage = readFileSync(`${generalPath}/master.html`).toString();
    let cssFile = process.env.name === "dev" ? "site.css" : "site.min.css";
    let jsFile = process.env.name === "dev" ? "site.js" : "site.min.js";
    masterPage = masterPage.replace("[SITE CSS]", "<style>\n" + readFileSync(`${process.env.buildDir}/${cssFile}`) + "\n</style>");
    masterPage = masterPage.replace("[SITE JS]", "<script>\n" + readFileSync(`${process.env.buildDir}/${jsFile}`) + "\n</script>");
    masterPage = replacePlaceholderWithHTMLFile(masterPage);
    
    writeFileSync(siteHTMLPath, masterPage);
};

const replacePlaceholderWithHTMLFile = outFile => {
    let generalPath = normalize(`${process.env.clientDir}/html`);
    let files = getFilesRecursively(generalPath);

    let placeholders = files.map(file => {
        let relativePath = file
            .replace(generalPath, "")
            .replace(/^[\\/]/, "")
            .replace(/\.html/,"")
            .toUpperCase();
        return {
            placeholder: `\\[${relativePath.replace(/\\/g, "/")}\\]`,
            filePath: file  
        };
    });

    placeholders.forEach(placeholder => {
        let placeholderRegex = new RegExp(placeholder.placeholder, "g");
        let placeholderText = readFileSync(placeholder.filePath).toString();
        outFile = outFile.replace(placeholderRegex, placeholderText);
    });

    return outFile;
};

const buildPostTemplate = outFile => {
    return readFileSync(`${process.env.postTemplatesDir}/post_template.html`).toString();    
};

const buildPostSubjectNavigation = (postNumber, subject) => {
    let navTemplate = readFileSync(`${process.env.postTemplatesDir}/subject_nav.html`).toString();
    let subjects = getPostSubjects(postNumber);
    let linkHTML = "";

    navTemplate = navTemplate.replace(/\[POST NUMBER\]/g, postNumber);
    $ = cheerio.load(navTemplate);
    let subjectsSelector = subjects.map(subject => {
        return `[href="/${postNumber}/${subject.replace(/_/g, "-")}"]`;
    }).join(",");

    let subjectLinks = $.root().find(subjectsSelector);
    subjectLinks.each((i, elm) => {
        let link = $(elm);
        let isCurSubject = link.is(`[href="/${postNumber}/${subject.replace(/_/g, "-")}"]`);
        if(isCurSubject) {
            link.addClass("badge-outlined");
        }

        linkHTML += $("<div></div>").append(link).html();
    });

    return linkHTML;
};

const buildPostComments = (outFile, postNumber, subject) => {
    let comments = readFileSync(`${process.env.postTemplatesDir}/comments.html`).toString();
    outFile = outFile.replace("[POST COMMENTS]", comments);
    return outFile;
};

const buildPostHTML = (htmlPath, postNumber, subject) => {
    let postTemplate = readFileSync(`${process.env.postTemplatesDir}/post_body.html`).toString();
    let subjects = getPostSubjects(postNumber);

    // <li>
    postTemplate = postTemplate.replace(/\[SUBJECT\]/g, subject);

    // the body of each subject
    let subjectContentPath = `${htmlPath}/${subject}.html`;
    let subjectContent = readFileSync(subjectContentPath).toString();
    postTemplate = postTemplate.replace("[POST SUBJECT CONTENTS]", subjectContent);

    return postTemplate;
}

const buildPostConfiguration = (jsonPath, outFile, subject) => {
    let config = JSON.parse(readFileSync(jsonPath));

    subject = subject.replace(/_/g, "-");
    let links = config.topics[subject].map(topic => {
        return `<a href='/appendix/${subject}#${topic.toLowerCase().replace(/ /g,"-")}'>${topic}</a>`;
    });
    outFile = outFile.replace("[POST TOPICS]", links.join(", "));

    for(let prop in config) {
        let placeholder = `\\[POST ${prop.toUpperCase()}\\]`; // escape! please.
        let placeholderRegex = new RegExp(placeholder, "g");
        outFile = outFile.replace(placeholderRegex, config[prop]);
    }
    return outFile;
};

const setPostNavigationLinks = (outFile, postNumber, subject) => {
    outFile = outFile.replace(/\[PAGINATION\]/g, readFileSync(`${process.env.postTemplatesDir}/pagination.html`).toString());
    $ = cheerio.load(outFile);
    let last = getLargestPostNumber();
    subject = subject.replace(/_/g, "-").toLowerCase();

    // first and prev
    if(postNumber === 1) {
        $('[data-link-to="first"]').parent().addClass("disabled");
        $('[data-link-to="previous"]').parent().addClass("disabled");
    }
    else {
        let prev = postNumber - 1;
        $('[data-link-to="first"]').attr("href", `/1/${subject}`);
        $('[data-link-to="previous"]').attr("href", `/${prev}/${subject}`);        
    }

    // random
    if(last === 1) {
        $('[data-link-to="random"]').parent().addClass("disabled");
    }
    else {
        let random = getRandomInt(1, last, postNumber);
        $('[data-link-to="random"]').attr("href", `/${random}/${subject}`);        
    }

    // next and last
    if(postNumber === last) {
        $('[data-link-to="next"]').parent().addClass("disabled");   
        $('[data-link-to="last"]').parent().addClass("disabled");           
    }
    else {
        let next = postNumber + 1;
        $('[data-link-to="next"]').attr("href", `/${next}/${subject}`);        
        $('[data-link-to="last"]').attr("href", `/${last}/${subject}`);        
    }

    return $.root().html();
};

const setPostMetaTags = (outFile, jsonPath, subject) => {
    let postJson = JSON.parse(readFileSync(jsonPath));
    let topics = postJson.topics[subject.replace(/_/g, "-")].join(", ");
    let subjectHumanFormat = capatalizeFirstLetterOfEveryWord(subject.replace(/_/g, " "));
    let description = `${subjectHumanFormat} problems for ${topics}.`;
    return outFile.replace("[META]", `<meta name="description" content="${description}" />`);
};

const minimizePageHTML = outFile => {
    return minify(outFile, {
        collapseInlineTagWhitespace: false,
        collapseWhitespace: true,
        html5: true,
        removeComments: true
    }).replace(/\n/g, "");
};

const buildPost = (postNumber, subject) => {
    let outFile = readFileSync(siteHTMLPath).toString();
    let outFilePath = `${process.env.buildDir}/${postNumber}.${subject}.html`;
    let generalPath = `${process.env.postsDir}/${postNumber}`;
    let htmlPath = `${generalPath}/subjects`;
    let jsonPath = `${generalPath}/post.json`;    
    
    outFile = outFile.replace("[CONTENT]", buildPostTemplate());
    outFile = outFile.replace("[POST SUBJECT NAVIGATION]", buildPostSubjectNavigation(postNumber, subject));
    outFile = outFile.replace("[POST HTML]", buildPostHTML(htmlPath, postNumber, subject));
    outFile = outFile.replace("[TITLE]", `Week ${postNumber} - ${capatalizeFirstLetterOfEveryWord(subject.replace(/-/g, " ").replace(/_/g, " "))}`); // note - if you change this title change the title for the index page in master.js
    outFile = buildPostComments(outFile, postNumber, subject);
    outFile = buildPostConfiguration(jsonPath, outFile, subject);
    outFile = setPostMetaTags(outFile, jsonPath, subject);
    outFile = setPostNavigationLinks(outFile, postNumber, subject);
    outFile = replacePlaceholderWithHTMLFile(outFile);

    outFile = outFile.replace('data-subject=""', `data-subject='${subject}'`);    
    outFile = outFile.replace('data-post-number=""', `data-post-number='${postNumber}'`);    
    outFile = outFile.replace('data-last-post-number=""', `data-last-post-number='${getLargestPostNumber()}'`);    

    if(process.env.name !== "dev") {
        outFile = minimizePageHTML(outFile);
    }

    writeFileSync(outFilePath, outFile);
    addGraphic(outFilePath);
};

const buildGlossary = subject => {
    let subjectGlossary = readFileSync(`${process.env.clientDir}/html/glossary/${subject}.html`).toString();
    let outFilePath = `${process.env.buildDir}/glossary.${subject}.html`;
    let title = `${capatalizeFirstLetterOfEveryWord(subject.replace(/_/g, " "))} Glossary`;
    buildStaticContentPage(subjectGlossary, title, title, outFilePath);
};

const buildAppendix = subject => {
    let subjectGlossary = readFileSync(`${process.env.clientDir}/html/appendix/${subject}.html`).toString();
    let outFilePath = `${process.env.buildDir}/appendix.${subject}.html`;
    let title = `${capatalizeFirstLetterOfEveryWord(subject.replace(/_/g, " "))} Appendix`;
    buildStaticContentPage(subjectGlossary, title, title, outFilePath);
};

const buildAboutPage = () => {
    let aboutPage = readFileSync(`${process.env.clientDir}/html/about.html`).toString();
    let outFilePath = `${process.env.buildDir}/about.html`;
    let title = "About"
    buildStaticContentPage(aboutPage, title, description, outFilePath);
};

const build404Page = () => {
    let aboutPage = readFileSync(`${process.env.clientDir}/html/404.html`).toString();
    let outFilePath = `${process.env.buildDir}/404.html`;
    let title = "404"
    buildStaticContentPage(aboutPage, title, description, outFilePath);
}

const buildStaticContentPage = (staticContent, title, description, outFilePath) => {
    let outFile = readFileSync(siteHTMLPath).toString();
    
    outFile = outFile.replace("[CONTENT]", staticContent);
    outFile = outFile.replace("[TITLE]", title);

    outFile = outFile.replace("[META]",  `<meta name="description" content="${description}" />`);
    
    // TODO: this is a terrible way of doing this
    // should ADD them where they are needed (on posts). dont want to setup cheerio on that right now.
    outFile = outFile.replace(' data-subject=""', "");
    outFile = outFile.replace(' data-post-number=""', "");
    outFile = outFile.replace(' data-last-post-number=""', "");

    if(isDev() === false) {
        outFile = minimizePageHTML(outFile);
    }

    writeFileSync(outFilePath, outFile);
    addGraphic(outFilePath);
};

const buildPages = () => {
    getPostNumbers().forEach(postNumber => {
        let subjects = getPostSubjects(postNumber);
        subjects.forEach(subject => {
            buildPost(postNumber, subject);
        });
    });

    getGlossarySubjects().forEach(buildGlossary);
    getAppendixSubjects().forEach(buildAppendix);
    buildAboutPage();
    build404Page();
};

const buildIndex = () => {
    let lastPost = getLargestPostNumber();
    let defaultSubject = process.env.defaultSubject;
    let indexFileContentPath = `${process.env.buildDir}/${lastPost}.${defaultSubject}.html`;
    let indexFilePath = `${process.env.publicDir}/index.html`;

    let indexContent = readFileSync(indexFileContentPath).toString();
    if(/<title>.*?<\/title>/.test(indexContent) === false) {
        throw "couldn't find title;"
    }
    else {
        indexContent = indexContent.replace(/<title>.*?<\/title>/, "<title>" + shortDescription + "</title>");
    }
    writeFileSync(indexFilePath, indexContent);
}

const rebuildOnChange = () => {
    let allFiles = getFilesRecursively(process.env.clientDir);
    allFiles.forEach(file => {
        unwatchFile(file);
        watchFile(file, build);
    });
};

const generateSiteMap = () => {
    let siteMap = '\
<?xml version="1.0" encoding="UTF-8"?>\n\
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    let template = '\
    <url>\n\
        <loc>[URL]</loc>\n\
        <lastmod>[YYYY-MM-DD]</lastmod>\n\
        <changefreq>[FREQUENCY]</changefreq>\n\
        <priority>[PRIORITY]</priority>\n\
    </url>';

    let postJsons = getPostNumbers().map(postNumber => {
        let postJSONPath = `${process.env.postsDir}/${postNumber}/post.json`;
        let postJson = JSON.parse(readFileSync(postJSONPath));
        let YYYY = postJson.date.split("/")[2];
        let MM = postJson.date.split("/")[0];
        let DD = postJson.date.split("/")[1];
        MM = MM.length === 1 ? `0${MM}` : MM;
        DD = DD.length === 1 ? `0${DD}` : DD;
        postJson.date = `${YYYY}-${MM}-${DD}`;
        postJson.postNumber = postNumber;
        return postJson;
    });

    let mostRecentPostDate = postJsons[postJsons.length - 1].date;
    let pages = [
        { 
            loc: "https://www.regressionbuddy.com",
            mod: mostRecentPostDate,
            freq: "weekly",
            priority: "1.0"
        },
        { 
            loc: "https://www.regressionbuddy.com/about",
            mod: mostRecentPostDate,
            freq: "weekly",
            priority: ".9"
        },
        { 
            loc: "https://www.regressionbuddy.com/rss.xml",
            mod: mostRecentPostDate,
            freq: "weekly",
            priority: ".8"
        }
    ];

    console.log("If subjects ever change this will need updated.");
    getPostSubjects(1).forEach(subject => {
        let appendix = {
            loc: `https://www.regressionbuddy.com/appendix/${subject}`,
            mod: mostRecentPostDate,
            freq: "weekly",
            priority: ".7"
        };
        pages.push(appendix);
    });
    getPostSubjects(1).forEach(subject => {
        let glossary = {
            loc: `https://www.regressionbuddy.com/glossary/${subject}`,
            mod: mostRecentPostDate,
            freq: "weekly",
            priority: ".6"
        };
        pages.push(glossary);
    });

    getPostNumbers().forEach(postNumber=> {
        let postJson = postJsons.filter(post => post.postNumber === postNumber)[0];
        postJson.loc = `https://www.regressionbuddy.com/${postNumber}`;
        postJson.mod = postJson.date;
        postJson.freq = "never";
        postJson.priority = ".5";
        pages.push(postJson);
    });

    pages.forEach(pageJson => {
        let page = template;
        page = page.replace("[URL]", pageJson.loc);
        page = page.replace("[YYYY-MM-DD]", pageJson.mod);
        page = page.replace("[FREQUENCY]", pageJson.freq);
        page = page.replace("[PRIORITY]", pageJson.priority);
        siteMap += `\n${page}`;
    });

    siteMap += '\n</urlset>';
    writeFileSync(`${process.env.buildDir}/sitemap.xml`, siteMap);
};

const generateSiteRSS = () => {
    let rss = '\
<?xml version="1.0" encoding="utf-8"?>\n\
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n\
    <channel>\n\
        <title>Regression Buddy RSS</title>\n\
        <link>https://www.regressionbuddy.com/</link>\n\
        <description>' + description + '</description>\n\
        <atom:link href="https://www.regressionbuddy.com/rss.xml" rel="self" type="application/rss+xml" />';

    let template  = '\
        <item>\n\
            <title>[TITLE]</title>\n\
            <link>[LINK]</link>\n\
            <guid>[LINK]</guid>\n\
            <pubDate>[POST DATE]</pubDate>\n\
            <description>[DESCRIPTION]</description>\n\
        </item>';

    let postJsons = getPostNumbers().reverse().map(postNumber => {
        let postJSONPath = `${process.env.postsDir}/${postNumber}/post.json`;
        let postJson = JSON.parse(readFileSync(postJSONPath));        
        let item = template;
        item = item.replace("[TITLE]", postJson.date);
        item = item.replace(/\[LINK\]/g, `https://www.regressionbuddy.com/${postNumber}`);

        let year = parseInt(postJson.date.split("/")[2], 10);
        let month = parseInt(postJson.date.split("/")[0], 10) - 1;
        let day = parseInt(postJson.date.split("/")[1], 10);
        let rfc = new Date(year, month, day);
        item = item.replace("[POST DATE]", `${rfc.toUTCString()}`);

        let description = getPostSubjects(postNumber).map(subject => {
            let subjectHumanFormat = capatalizeFirstLetterOfEveryWord(subject.replace(/_/g, " "));
            let subjectIdentifier = subject.replace(/_/g, "-");
            return subjectHumanFormat + " (" + postJson.topics[subjectIdentifier].join(", ") + ")";
        }).join(", ");

        item = item.replace("[DESCRIPTION]", `${description}`);
        
        rss += `\n${item}`;
    });

    rss += "\n\
    </channel>\n\
</rss>";
    writeFileSync(`${process.env.buildDir}/rss.xml`, rss);
};

const addGraphic = path => {
    return; // looks incompetent if there are line breaks
    let graphic = "    ______                             _              ______           _     _       \n\
    | ___ \\                           (_)             | ___ \\         | |   | |      \n\
    | |_/ /___  __ _ _ __ ___  ___ ___ _  ___  _ __   | |_/ /_   _  __| | __| |_   _ \n\
    |    // _ \\/ _` | '__/ _ \\/ __/ __| |/ _ \\| '_ \\  | ___ \\ | | |/ _` |/ _` | | | |\n\
    | |\\ \\  __/ (_| | | |  __/\\__ \\__ \\ | (_) | | | | | |_/ / |_| | (_| | (_| | |_| |\n\
    \\_| \\_\\___|\\__, |_|  \\___||___/___/_|\\___/|_| |_| \\____/ \\__,_|\\__,_|\\__,_|\\__, |\n\
                __/ |                                                           __/ |\n\
               |___/                                                           |___/ ";

    let file = readFileSync(path).toString();
    let doctypeMatches = /^<!DOCTYPE html>/.test(file);
    if(!doctypeMatches) {
        throw "something went wrong. doctype doesn't match";
    }
    file = file.replace("<!DOCTYPE html>", "<!DOCTYPE html>\n<!--\n" + graphic + "\n-->\n");
    writeFileSync(path, file);
}

const build = () => {
    console.log("linear algebra, at least, title is messed up in browser");
    console.log("building...");
    console.warn("cheerio adds a body tag if it encounters a text node. e.g. [REPLACE THIS]");
    console.log("reminder: subscribe to disqus for api calls");
    console.log("check browserstack for bottom of appendix. does <br> work?");
    console.log("udpate lambda to redirect if given https://regressionbuddy.com/2/algebra/");
    console.log("still need styles for last/bottom function in function group. can handle not being wrapped and being wrapped");
    console.log("please look at spacing around the problem class. make sure it is applied consistently. maybe it sohuldnt be named problem or that functionality can be abstracted");
    //console.log("add section about mistakes in about. please send me a message if you encounter a mistake so that ");
    console.log("add linksin svg");
    console.log("HUGE ISSUE - Can't right click on appendix or glossary dropdown. Right click triggers click");
    console.log("remove left container");
    console.log("ACTUALLY USE LAZY IMAGE LOADING CODE THAT YOU ADDED");
    console.log("make sure geogebra files match the question they apply to");
    console.log("SPACING --- linear algebra problems wk1 - #2 doesnt have the same margin on the right for some reason");
    console.log("right click on images");
    console.log("in appendix a bunch of text-center immediately by text-left");
    console.log("you still have to fix the spacing problem at 767 pixels in vector calculus appendix.");
    console.log("i think algebra appendix should be extended so its definition of real numbers has the 0 and 1 identities... so that it matches vector space identites");
    console.log("IMPORTANT STYLE RULE. STANDALONE NEGATIVES GET A TEXT -. NOT A MATH MODE NEGATIVE. IT'S TOO LONG. GO THROUGH AND FIX");
    integrateSiteJavaScript();
    minimizeSiteJavaScript();

    integrateSiteCSS();
    minimizeSiteCSS();

    buildMasterPage();
    buildPages();
    buildIndex();

    generateSiteMap();
    generateSiteRSS();

    if(isDev()) {
        rebuildOnChange();
    }

    console.log('\u0007');
};

module.exports = {
    build: build
};