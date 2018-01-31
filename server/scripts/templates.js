// cheerio can't find elements inside of a <template> tag. so <template> is called <placeholder>

const { readFileSync } = require("fs");
const cheerio = require('cheerio');

const applyTemplates = html => {
    $ = cheerio.load(html);
    let templates = $.root().find("placeholder");
    templates.each(applyTemplate);
    return $.html();
};

const applyTemplate = (i, elm) => {
    let $placeholder = $(elm);
    let templateType = $placeholder.attr("type");
    let functionName = `apply_${templateType}`;
    templates[functionName]($placeholder);
}

let templates = {
    apply_li_with_sublist: $placeholder => {
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
    }
};

module.exports = {
    applyTemplates: applyTemplates
};