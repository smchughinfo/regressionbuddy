// cheerio can't find elements inside of a <template> tag. so <template> is called <placeholder>

const { readFileSync } = require("fs");
const cheerio = require('cheerio');

const applyTemplates = html => {
    $ = cheerio.load(html);

    $.root().find("li-with-sublist").each(apply_li_with_sublist);
    $.root().find("li-text").each(apply_li_text);

    return $.html();
};

const apply_li_with_sublist = (i, elm) => {
    let $placeholder = $(elm);
    let templatePath = `${process.env.templatesDir}/li_with_sublist.html`;
    let $template = $(readFileSync(templatePath).toString());
        
    let $items = $placeholder.find("item");
    let $repeater = $template.find("[repeater]");
    let $repeatContainer = $repeater.parent();

    $repeater.remove();
    $repeater.removeAttr("repeater");
    
    $items.each((i, elm) => {
        let $repeaterClone = $repeater.clone();
        $repeaterClone.html($(elm).html());
        $repeatContainer.append($repeaterClone);
    });
    
    $placeholder.replaceWith($template);
};

const apply_li_text = (i, elm) => {
    let $placeholder = $(elm);
    let templatePath = `${process.env.templatesDir}/li_text.html`;
    let $template = $(readFileSync(templatePath).toString());
        
    let text = $placeholder.html();
    $template.find("span").html(text);
    
    $placeholder.replaceWith($template);
};

module.exports = {
    applyTemplates: applyTemplates
};