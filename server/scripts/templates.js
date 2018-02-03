// cheerio can't find elements inside of a <template> tag. so <template> is called <placeholder>
// each template is completely responsible for validating its child elements.

const { readFileSync, writeFileSync } = require("fs");
const cheerio = require('cheerio');

const applyTemplates = html => {
    $ = cheerio.load(html);

    // should only top level templates be listed?
    let _templates = ["primary-list", "nested-list", "li-text", "top-text", "group-carrier", "group", "group-item"]; // in order of how they are applied
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
        
        let childTypes = ["nested-list", "group-carrier", "li-text"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.find(childTypesSelector);

        // validate child element types
        if($items.length === 0) {
            throw "Could not find a valid child type for template 'primary_list'.";
        }
    
        let $repeater = $template.find("[repeater]");
        let $repeatContainer = $repeater.parent();
        $repeater.remove();
        $repeater.removeAttr("repeater");
        
        $items.each((i, elm) => {
            let $repeaterClone = $repeater.clone();
            $repeaterClone.find("[content]").removeAttr("content").append(elm);
            console.log("CHECK THAT ITS ACTUALLY REMOVING [CONTENT]");
            let tagName = elm.tagName;
            let funcName = tagName.replace(/-/g, "_");
            templates[funcName](elm);

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
    
        // <top-text>
        let $topText = $placeholder.find("top-text");
        if($topText.length === 0) {
            $template.find("top-text").remove();
        }
        else {
            $template.find("top-text").replaceWith($topText);
            templates.top_text($template.find("top-text")[0]);
        }

        // <item>
        let $repeater = $template.find("[repeater]");
        let $repeatContainer = $repeater.parent();
        $repeater.remove();
        $repeater.removeAttr("repeater");
        
        let $items = $placeholder.find("item");
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
        let $template = $("<template-container>" + readFileSync(templatePath).toString() + "</template-container>");

        // <top-text>
        let $topText = $placeholder.find("top-text");
        if($topText.length === 0) {
            $template.find("top-text").remove();
        }
        else {
            $template.find("top-text").replaceWith($topText);
            templates.top_text($template.find("top-text")[0]);
        }

        // <span> - the actual text
        let text = $placeholder.find("text").html();
        $template.find("span").html(text);
        
        $placeholder.after($template.html());
        $placeholder.remove();
    },
    top_text: elm => {
        let $placeholder = $(elm);

        let templatePath = `${process.env.templatesDir}/top_text.html`;
        let $template = $("<template-container>" + readFileSync(templatePath).toString() + "</template-container>");

        let text = $placeholder.html();
        let $div = $template.find("div");
        $div.html(text);
        
        $placeholder.replaceWith($div);
    },
    group_carrier: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/group_carrier.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["group"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.find(childTypesSelector);

        // validate child element types
        if($items.length === 0) {
            throw "Could not find a valid child type for template 'group_carrier'.";
        }

        $items.each(templates.group);
        $template.html($placeholder.html());
        $placeholder.replaceWith($template);
    },
    group: (i, elm) => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/group.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["item"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.find(childTypesSelector);

        // validate child element types
        if($items.length === 0) {
            throw "Could not find a valid child type for template 'group'.";
        }

        $items.each(templates.group_item);
        $template.html($placeholder.html());
        $placeholder.replaceWith($template);
    },
    group_item: (i, elm) => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/group_item.html`;
        let $template = $(readFileSync(templatePath).toString());

        console.log("make sure its actually removing [content]");
        $template.find("[content]").removeAttr("content").html($placeholder.html());
        
        $placeholder.replaceWith($template);
    },
}

module.exports = {
    applyTemplates: applyTemplates
};