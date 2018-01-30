const cheerio = require('cheerio');

const applyTemplates = html => {
    $ = cheerio.load(html);
    let templates = $.root().find("template");
    templates.each(applyTemplate);
    return $.html();
};

const applyTemplate = (i, elm) => {
    let template = $(elm);
    let templateParts = template.html().split("\n");

    let newlineIndex = templateParts.indexOf("\n");
    console.log(templateParts)
    let templateName = templateParts.splice(0, newlineIndex);
    let items = templateParts.splice(templateParts);

    console.log(templateName);

   // console.log(items);
    //let templateName = `${process.env.templatesDir}/${templateParts[0]}`;
}

module.exports = {
    applyTemplates: applyTemplates
};