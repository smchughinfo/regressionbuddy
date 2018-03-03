const { readFileSync, writeFileSync, watchFile, unwatchFile, mkdirSync } = require("fs");
const { normalize, sep} = require("path");
const compressor = require("node-minify");
const { existsSync, getDirectories, deleteFilesFromDirectory, getPostNumbers, getPostNumbersInReview, getLargestPostNumber, getFiles, getFilesRecursively, isDev, getPostSubjects, getGlossarySubjects, getAppendixSubjects, getRandomInt, capatalizeFirstLetterOfEveryWord, getPostConfig, sortObjectArrayByKey } = require("./utilities.js");
const { applyTemplates } = require("./templates.js");
const zlib = require('zlib');
const { minify } = require("html-minifier");
const cheerio = require('cheerio');
const stripDebug = require('strip-debug');
const pretty = require('pretty');
const html5Lint = require('html5-lint');
const colors = require('colors');

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
        `${process.env.clientDir}/scripts/utilities/utilities.js`,
        `${process.env.clientDir}/scripts/utilities/click_handler.js`,
        `${process.env.clientDir}/scripts/master.js`,
        `${process.env.clientDir}/scripts/image_maximizer.js`,
        `${process.env.clientDir}/scripts/cheat_code.js`,
        `${process.env.clientDir}/scripts/url_hacks.js`,
        `${process.env.clientDir}/scripts/top_nav.js`,
        `${process.env.clientDir}/scripts/component_nav.js`,
        `${process.env.clientDir}/scripts/comments.js`
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
        // global
        `${process.env.clientDir}/styles/master.css`,
            `${process.env.clientDir}/styles/top_nav.css`,
            `${process.env.clientDir}/styles/graph.css`,
            `${process.env.clientDir}/styles/mathjax.css`,
            `${process.env.clientDir}/styles/function_group.css`,
            `${process.env.clientDir}/styles/horizontal_group.css`,
            `${process.env.clientDir}/styles/hard_coded_dimensions.css`,
            `${process.env.clientDir}/styles/image_maximizer.css`,

        // individual pages
        `${process.env.clientDir}/styles/post.css`,
            `${process.env.clientDir}/styles/component_nav.css`,
            `${process.env.clientDir}/styles/badge_outline.css`,
            `${process.env.clientDir}/styles/cheat_code.css`,
        `${process.env.clientDir}/styles/appendix.css`,
            `${process.env.clientDir}/styles/wider_line.css`,
        `${process.env.clientDir}/styles/glossary.css`,
        `${process.env.clientDir}/styles/review.css`,
        `${process.env.clientDir}/styles/404.css`,

        // old browsers
        `${process.env.clientDir}/styles/old_browsers/old_browsers.css`,
        `${process.env.clientDir}/styles/old_browsers/top_nav.css`
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

const buildPostConfiguration = (postNumber, outFile, subject) => {
    let config = getPostConfig(postNumber)

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
    let inReview = getPostConfig(postNumber).inReview === true;
    subject = subject.replace(/_/g, "-").toLowerCase();

    console.log("UNSET HARDCODE TO TRUE");

    // first and prev
    if(true || postNumber === 1 || inReview) {
        $('[data-link-to="first"]').parent().addClass("disabled");
        $('[data-link-to="previous"]').parent().addClass("disabled");
    }
    else {
        let prev = postNumber - 1;
        $('[data-link-to="first"]').attr("href", `/1/${subject}`);
        $('[data-link-to="previous"]').attr("href", `/${prev}/${subject}`);        
    }

    // random
    if(true || last === 1 || inReview) {
        $('[data-link-to="random"]').parent().addClass("disabled");
    }
    else {
        let random = getRandomInt(1, last, postNumber);
        $('[data-link-to="random"]').attr("href", `/${random}/${subject}`);        
    }

    // next and last
    if(true || postNumber === last || inReview) {
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

const setPostMetaTags = (outFile, postNumber, subject) => {
    let postJson = getPostConfig(postNumber);
    let topics = postJson.topics[subject.replace(/_/g, "-")].join(", ");
    let subjectHumanFormat = capatalizeFirstLetterOfEveryWord(subject.replace(/_/g, " "));
    let description = `${subjectHumanFormat} problems for ${topics}.`;
    return outFile.replace("[META]", `<meta name="description" content="${description}" />`);
};

const minimizePageHTML = outFile => {
    return minify(outFile, {
        collapseInlineTagWhitespace: false,
        collapseWhitespace: false,
        html5: true,
        removeComments: true
    }).replace(/\n/g, "");
};

const buildPost = (postNumber, subject) => {
    let outFile = readFileSync(siteHTMLPath).toString();
    let outFilePath = `${process.env.buildDir}/${postNumber}.${subject}.html`;
    let generalPath = `${process.env.postsDir}/${postNumber}`;
    let htmlPath = `${generalPath}/subjects`;
    
    outFile = outFile.replace("[CONTENT]", buildPostTemplate());
    outFile = outFile.replace("[POST SUBJECT NAVIGATION]", buildPostSubjectNavigation(postNumber, subject));
    outFile = outFile.replace("[POST HTML]", buildPostHTML(htmlPath, postNumber, subject));
    outFile = outFile.replace("[TITLE]", `Week ${postNumber} - ${capatalizeFirstLetterOfEveryWord(subject.replace(/-/g, " ").replace(/_/g, " "))}`); // note - if you change this title change the title for the index page in master.js
    outFile = buildPostComments(outFile, postNumber, subject);
    outFile = buildPostConfiguration(postNumber, outFile, subject);
    outFile = setPostMetaTags(outFile, postNumber, subject);
    outFile = setPostNavigationLinks(outFile, postNumber, subject);
    outFile = replacePlaceholderWithHTMLFile(outFile);

    outFile = outFile.replace('data-subject=""', `data-subject='${subject}'`);    
    outFile = outFile.replace('data-post-number=""', `data-post-number='${postNumber}'`);    
    outFile = outFile.replace('data-last-post-number=""', `data-last-post-number='${getLargestPostNumber()}'`);    

    outFile = applyTemplates(outFile);

    outFile = pretty(outFile);
    if(process.env.name !== "dev") {
        outFile = minimizePageHTML(outFile);
    }

    if(!getPostConfig(postNumber).inReview) {
        writeFileSync(outFilePath, outFile);
        addGraphic(outFilePath);
    }

    // this part is for the review file:
    let reviewFilePath = `${process.env.buildDir}/${postNumber}.${subject}.review.html`;
    let $ = cheerio.load(outFile);
    let title = $.root().find("title");
    let meta = $.root().find("meta[name='description']");
    let nav = $.root().find("body > nav:first-of-type");
    let subjectNavs = $.root().find(".subject-options a");
    let topicLinks = $.root().find("#topicLinks a");
    title.html(`Review - ${title.html()}`);
    meta.attr("content", `Page Under Review: ${meta.attr("content")}`);
    nav.after('<div class="alert alert-warning" role="alert">The contents of this page are under review.</div>');
    subjectNavs.each((i, elm) => { 
        let a = $(elm);
        let href = a.attr("href");
        a.attr("href", `${href}/review`);
    });
    topicLinks.each((i, elm) => { 
        let a = $(elm);
        let href = a.attr("href");
        let parts = href.split("#");
        parts[0] = parts[0].replace("/", "");
        a.attr("href", `/${postNumber}/${parts[0]}/review#${parts[1]}`);
    });
    let reviewOutFile = $.html();
    writeFileSync(reviewFilePath, reviewOutFile);
    addGraphic(reviewFilePath);
};

const buildGlossary = subject => {
    let subjectGlossary = readFileSync(`${process.env.clientDir}/html/glossary/${subject}.html`).toString();
    let outFilePath = `${process.env.buildDir}/glossary.${subject}.html`;
    let title = `${capatalizeFirstLetterOfEveryWord(subject.replace(/_/g, " "))} Glossary`;
    buildStaticContentPage(subjectGlossary, title, title, outFilePath);
};

const buildAppendix = subject => {
    let appendixTemplate = readFileSync(`${process.env.clientDir}/html/appendix/appendix.html`).toString();
    let $appendixTemplate = $("<appendix-template-container>" + appendixTemplate + "</appendix-template-container>");
    let outFilePath = `${process.env.buildDir}/appendix.${subject}.html`;
    let title = `${capatalizeFirstLetterOfEveryWord(subject.replace(/_/g, " "))} Appendix`;

    // set title
    $appendixTemplate.find(".header-text").html(title);

    // append topics
    let topicFiles = getFiles(`${process.env.clientDir}/html/appendix/${subject}`);
    let topics = topicFiles.map(filePath => {
        let fileName= filePath.split(sep).pop();
        let fileIndex = parseInt(fileName.split(".")[0], 10);
        let fileContent = readFileSync(filePath).toString();
        return {
            index: fileIndex,
            content: fileContent
        };
    });
    topics = sortObjectArrayByKey(topics, "index");
    topics.forEach(topic => {
        $appendixTemplate.find("#appendix").append(topic.content);
    });

    let subjectAppendix = $appendixTemplate.html();
    subjectAppendix = applyTemplates(subjectAppendix, true);

    buildStaticContentPage(subjectAppendix, title, title, outFilePath);
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

    outFile = pretty(outFile);

    if(isDev() === false) {
        outFile = minimizePageHTML(outFile);
    }

    writeFileSync(outFilePath, outFile);
    addGraphic(outFilePath);
};

const buildPages = () => {
    getPostNumbers(true).forEach(postNumber => {
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
    console.log("allow index to build once first post is out of review");
    var index = `<div class="jumbotron">\
    <h1 class="display-3">Regression Buddy is in Review</h1>\
    <p class="lead">Welcome to regressionbuddy.com, the cool new math website all the kids are talking about. The current go live date is 3/11/18. In the meantime you can help improve the quality of this site by participating in its <a href="/review">first review</a>.</p>\
    </p>\
  </div>`;
    buildStaticContentPage(index, shortDescription, description, `${process.env.publicDir}/index.html`);
    return;

    let lastPost = getLargestPostNumber();
    let defaultSubject = process.env.defaultSubject;
    let indexFileContentPath = `${process.env.buildDir}/${lastPost}.${defaultSubject}.html`;
    let indexFilePath = `${process.env.publicDir}/index.html`;

    let indexContent = readFileSync(indexFileContentPath).toString();

    let $ = cheerio.load(indexContent);
    $.root().find("title").html(shortDescription);
    $.root().find("meta[name='description']").attr("content", description);
    indexContent = $.html();

    writeFileSync(indexFilePath, indexContent);
}

const buildReviewAppendixes = () => {
    getPostNumbers(true).forEach(postNumber => {
        getPostSubjects(postNumber).forEach(subject => {
            let config = getPostConfig(postNumber);
            let postTopics = config.topics[subject.replace(/_/g, "-")];            
            let appendix = readFileSync(`${process.env.buildDir}/appendix.${subject}.html`).toString();
            let appendixTitle = `${subject} Appendix`;
            let appendixOutFilePath = `${process.env.buildDir}/${postNumber}.appendix.${subject}.review.html`;
        
            postTopics = postTopics.map(topic => {
                return topic.toLowerCase().replace(/ /g, "-");
            });

            let $ = cheerio.load(appendix);
            let topics = $.root().find("#appendix > *");
            topics.each((i, elm) => {
                let topic = $(elm).attr("id") || "";
                if(postTopics.indexOf(topic) === -1) {
                    $(elm).remove();
                }
                else {
                    $(elm).after("<br>")
                }
            });

            let title = $.root().find("title");
            let body = $.root().find("body");
            let h4 = $.root().find("body > h4");
            let nav = $.root().find("nav");
            let appendixElm = $.root().find("#appendix");
            let meta = $.root().find("meta[name='description']");
            title.html(`Review - ${title.html()}`);
            meta.attr("content", `Page Under Review: ${meta.attr("content")}`);
            h4.html(`Week ${postNumber} - ${h4.html()} Review`);
            nav.after('<div class="alert alert-warning" role="alert">The contents of this page are under review.</div>');
            appendixElm.append('<div class="container-fluid">' + readFileSync(`${process.env.postTemplatesDir}/show_comments_link.html`).toString() + '</div><br>');
            appendixElm.after(readFileSync(`${process.env.postTemplatesDir}/comments.html`).toString());
            console.log("HAS THIS BECOME AN ISSUE?");
            body.find("#comments > br:first-of-type").remove(); // this is pretty bad.
            body.append("<br><br>"); // make it easier to see comments
            let outFile = $.html();

            if(isDev() === false) {
                outFile = minimizePageHTML(outFile);
            }

            writeFileSync(appendixOutFilePath, outFile);
            addGraphic(appendixOutFilePath);
        });
    });
}

const buildReviewPage = () => {
    let postsInReview = getPostNumbersInReview();
    let review = readFileSync(`${process.env.clientDir}/html/review.html`).toString();
    let outFilePath = `${process.env.buildDir}/review.html`;
    let title = "Review";

    let template = '\
        <div class="container-fluid">\
            <div class="card">\
                <div class="card-body">\
                    <div class="left-right">\
                        <span class="left">[TITLE]</span>\
                        <span class="right" data-comments-for="[URL]"></span>\
                    </div>\
                    <span class="right" data-comments-for="[URL]">[TOPICS]</span><br>\
                    <a data-link-with-comments="true" href="[URL]">Post Review</a>\
                    <span data-comment-count-for="[URL]">&nbsp;&nbsp;<img src="/images/loading.png" alt="Loading Spinner" class="inline-loader" /></span>\
                    <br>\
                    <a data-link-with-comments="true" href="[APPENDIX_URL]">Appendix Review</a>\
                    <span data-comment-count-for="[APPENDIX_URL]">&nbsp;&nbsp;<img src="/images/loading.png" alt="Loading Spinner" class="inline-loader" /></span>\
                </div>\
            </div>\
        </div>';

    let reviews = "";
    postsInReview.forEach(postNumber => {
        let config = getPostConfig(postNumber);
        let subjects = getPostSubjects(postNumber);

        subjects.forEach(subject => {
            let postReview = template;
            let subjectHumanFormat = capatalizeFirstLetterOfEveryWord(subject.replace(/_/g, " "));
            let postReviewTitle = `Week ${postNumber} - ${subjectHumanFormat} - ${config.date}`;
            let postTopics = config.topics[subject.replace(/_/g, "-")];  

            postReview = postReview.replace(/\[TITLE\]/g, postReviewTitle);
            postReview = postReview.replace(/\[URL\]/g, `/${postNumber}/${subject.replace(/_/g, "-")}/review`);
            postReview = postReview.replace(/\[APPENDIX_URL\]/g, `/${postNumber}/appendix/${subject.replace(/_/g, "-")}/review`);
            postReview = postReview.replace(/\[TOPICS\]/g, postTopics.join(", "));
            reviews += postReview;
            reviews += "<br>";

            let appendixReview = template;
            
            console.log("ADD OTHER STUFF HERE...");
        });
    });

    review = review.replace("[REVIEWS]", reviews);

    buildStaticContentPage(review, title, "Regression Buddy Review", outFilePath);
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

    console.log("UNSET THIS!!!");
    console.log("UNSET MASTER.JS // redirect to normalized url --- ON THE CLIENT SIDE //() -> ()");
    let mostRecentPostDate = "2/25/18";//postJsons[postJsons.length - 1].date;
    let pages = [
        { 
            loc: "https://www.regressionbuddy.com",
            mod: mostRecentPostDate,
            freq: "weekly",
            priority: "1.0"
        }
    ];

    console.log("If subjects ever change this will need updated.");
    getPostSubjects(1).forEach(subject => {
        let appendix = {
            loc: `https://www.regressionbuddy.com/appendix/${subject}`,
            mod: mostRecentPostDate,
            freq: "weekly",
            priority: ".9"
        };
        pages.push(appendix);
    });

    pages.push({ 
        loc: "https://www.regressionbuddy.com/about",
        mod: mostRecentPostDate,
        freq: "weekly",
        priority: ".8"
    });
    pages.push({ 
        loc: "https://www.regressionbuddy.com/review",
        mod: mostRecentPostDate,
        freq: "weekly",
        priority: ".7"
    });
    pages.push({ 
        loc: "https://www.regressionbuddy.com/rss.xml",
        mod: mostRecentPostDate,
        freq: "weekly",
        priority: ".6"
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

const lint = () => {
    let errorNum = 1;
    let builtFiles = getFiles(process.env.buildDir);
    let lintedFiles = 0;
    let anyErrors = false;
    builtFiles.forEach(file => {
        if(
            file.endsWith("html") === false ||
            file.endsWith("site.master.html")
        ) {
            lintedFiles++;
            return;
        }

        let unlintedHTML = readFileSync(file).toString();
        html5Lint(unlintedHTML, (err, results) => {
            if(results) {
                results.messages.forEach(msg => {
                    if(
                        msg.message !== "Bad value “” for attribute “src” on element “img”: Must be non-empty." &&
                        msg.message !== "Element “img” is missing required attribute “src”."
                    ){
                        anyErrors = true;

                        let color = "white";
                        color = msg.type === "info" ? "cyan" : color;
                        color = msg.type === "warning" ? "yellow" : color;
                        color = msg.type === "error" ? "red" : color;
        
                        let consoleMessage = `${errorNum++}. `;
                        consoleMessage += `HTML5 Lint [${msg.type}]\n`;
                        consoleMessage += `file: ${file}\n`;
                        consoleMessage += `lastLine: ${msg.lastLine}\n`;
                        consoleMessage += `lastColumn: ${msg.lastColumn}\n`;
                        consoleMessage += `${msg.type}: ${msg.message}\n`;
                        consoleMessage += `extract: ${msg.extract.length > 100 ? msg.extract.substring(0, 100) : msg.extract}\n`;
                        consoleMessage += `------------------------------\n`;   

                        console.log(consoleMessage[color]);
                    }
                });
                if(++lintedFiles === builtFiles.length && anyErrors === false) {
                    console.log("Lint Complete".green);
                }
            }
            if(++lintedFiles === builtFiles.length && anyErrors === false) {
                console.log("Lint Complete".green);
            }
        });
    });
}

const build = () => {
    console.log("building...");
    console.log("WHEN YOU DO SPECIAL LIMITS MAKE SURE TO INCLUDE PAGE 105.");

    createOrCleanBuildDirectory();
    
    integrateSiteJavaScript();
    minimizeSiteJavaScript();

    integrateSiteCSS();
    minimizeSiteCSS();

    buildMasterPage();
    buildPages();
    buildIndex();

    generateSiteMap();
    generateSiteRSS();

    buildReviewPage();
    buildReviewAppendixes();

    // async but i guess it doesn't matter
    lint();

    if(isDev()) {
        rebuildOnChange();
    }

    console.log('\u0007');
};

module.exports = {
    build: build
};