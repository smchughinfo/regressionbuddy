// cheerio can't find elements inside of a <template> tag. so <template> is called <placeholder>
// each template is completely responsible for validating its child elements.

const { readFileSync } = require("fs");
const cheerio = require('cheerio');

const applyTemplates = html => {
    $ = cheerio.load(html);

    let _templates = ["primary-list", "nested-list", "li-text"]; // in order of how they are applied

    _templates.forEach(template => {
        $.root().find(template).each((i, elm) => {
            template = template.replace(/-/g, "_");
            templates[template](elm);
        });
    });

    return $.html();
};

let templates = {
    primary_list: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/primary_list.html`;
        let $template = $(readFileSync(templatePath).toString());
        
        let childTypes = ["nested-list", "li-text"];
        let childTypesSelector = childTypes.join(",");
        let items = $placeholder.find(childTypesSelector);

        // validate child element types
        if(items.length === 0) {
            throw "Could not find a valid child type for template 'primary_list'.";
        }
    
        let $repeater = $template.find("[repeater]");
        let $repeatContainer = $repeater.parent();
        $repeater.remove();
        $repeater.removeAttr("repeater");
        
        items.each((i, elm) => {
            let $repeaterClone = $repeater.clone();
            $repeaterClone.append(elm);

            let tagName = elm.tagName;
            let funcName = tagName.replace(/-/g, "_");
            templates[funcName](elm);

            console.log("APPENDING REPEATER");
            $repeatContainer.append($repeaterClone);
        });
    
        // make the parent element switch
        let innerHTML = $placeholder.html();
        $placeholder.replaceWith($template);
        $placeholder.html(innerHTML);
    },
    nested_list: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/nested_list.html`;
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
    },
    li_text: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/li_text.html`;
        let $template = $(readFileSync(templatePath).toString());
            
        let text = $placeholder.html();
        $template.html(text);
        
        $placeholder.replaceWith($template);
    }
}

module.exports = {
    applyTemplates: applyTemplates
};