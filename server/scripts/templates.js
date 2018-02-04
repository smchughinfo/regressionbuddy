// cheerio can't find elements inside of a <template> tag. so <template> is called <placeholder>
// each template is completely responsible for validating its child elements.

const { readFileSync, writeFileSync } = require("fs");
const cheerio = require('cheerio');

const applyTemplates = html => {
    $ = cheerio.load(html);

     // list templates in the order they are applied.
     // if  on occassion a template1 is inside template2
     // and on occassion b template2 is inside template1
     // ...then idk.
    let _templates = ["primary-list", "nested-list", "graph-with-caption", "li-text", "top-text", "group-carrier", "group", "group-item", "cheat", "graph-container"];
    _templates.forEach(template => {
        $.root().find(template).each((i, elm) => {
            template = template.replace(/-/g, "_");
            templates[template](elm);
        });
    });

    return $.html();
};

const validateChildTypes = (childTypes, $placeholder, templateName) => {
    let childTypesSelector = childTypes.join(",");
    let $children = $placeholder.children(childTypesSelector);

    //console.log(templateName + " " + $children.length + " " + $placeholder.html() + "\r\n\r\n\r\n-----------------\r\n");
    // doesnt account for text nodes.
    if($children.length === 0) {
        throw `Could not find a valid child type for template ${templateName}.`;
    }
    if($children.length != $placeholder.children().length) {
        throw `Invalid child types found for template ${templateName}.`;
    }
};

let templates = {
    primary_list: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/primary_list.html`;
        let $template = $(readFileSync(templatePath).toString());
        
        let childTypes = ["nested-list", "group-carrier", "li-text", "graph-container"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.children(childTypesSelector);

        // validate template
        validateChildTypes(childTypes, $placeholder, "primary_list");  
    
        let $repeater = $template.find("[repeater]");
        let $repeatContainer = $repeater.parent();
        $repeater.remove();
        $repeater.removeAttr("repeater");
        
        $items.each((i, elm) => {
            let $repeaterClone = $repeater.clone();
            $repeaterClone.find("[content]").removeAttr("content").append(elm);
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
        let $template = $("<template-container>" + readFileSync(templatePath).toString() + "<template-container>");
    
        let childTypes = ["top-text", "item"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "nested_list");    

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
            let $item = $(elm);
            let $repeaterClone = $repeater.clone();
            let $content = $repeaterClone.find("[content]").removeAttr("content");

            let isGraphContainer = $item.children("graph-container").length > 0;
            let isGraphWithCaption = $item.children("graph-with-caption").length > 0;
            if(isGraphContainer) {
                // <graph-container>
                let $graphContainer = $item.find("graph-container");
                $content.append($graphContainer);
                templates.graph_container($graphContainer[0]);
            }
            else if(isGraphWithCaption) {
                // <graph-with-caption>
                let $graphWithCaption = $item.find("graph-with-caption");
                $content.append($graphWithCaption);
                console.log("CALLING IT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!_ >");
                templates.graph_with_caption($graphWithCaption[0]);
            }
            else {
                // text nodes
                $content.html($item.html());
            }
            $repeatContainer.append($repeaterClone);
        });
        
        $placeholder.replaceWith($template.html());
    },
    li_text: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/li_text.html`;
        let $template = $("<template-container>" + readFileSync(templatePath).toString() + "</template-container>");

        let childTypes = ["top-text", "text"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "li_text");        

        // <top-text>
        let $topText = $placeholder.find("top-text");
        if($topText.length === 0) {
            $template.find("top-text").remove();
        }
        else {
            $template.find("top-text").replaceWith($topText);
            templates.top_text($template.find("top-text")[0]);
        }

        // <text>
        let $text = $placeholder.find("text");
        if($text.length === 0) {
            $template.find("span").remove();
        }
        else {
            let text = $text.html();
            $template.find("span").html(text);
        }
        
        $placeholder.after($template.html());
        $placeholder.remove();
    },
    top_text: elm => {
        let $placeholder = $(elm);

        let templatePath = `${process.env.templatesDir}/top_text.html`;
        let $template = $("<template-container>" + readFileSync(templatePath).toString() + "</template-container>");

        // the text
        let text = $placeholder.html();
        let $div = $template.find("div");
        $div.html(text);
        
        // [cheat="factor"]
        let cheat = $placeholder.attr("cheat");
        if(cheat !== undefined) {
            let $cheat = $("<cheat>");
            $div.append($cheat);
            $cheat.html($placeholder.attr("cheat"));
            templates.cheat($cheat[0]);
        }

        $placeholder.replaceWith($div);
    },
    group_carrier: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/group_carrier.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["group", "top-text"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.children(childTypesSelector);

        // validate template
        validateChildTypes(childTypes, $placeholder, "group_carrier");

        // <top-text>
        let $topText = $placeholder.find("top-text");
        if($topText.length === 0) {
            $template.find("top-text").remove();
        }
        else {
            $template.find("top-text").replaceWith($topText);
            templates.top_text($template.find("top-text")[0]);
        }

        // <group>
        let $groups = $placeholder.find("group");
        $groups.each((i, groupElm) => {
            let numberOfGroups = $groups.length;
            templates.group(numberOfGroups, i, groupElm);
        });

        $template.append($placeholder.html());
        $placeholder.replaceWith($template);
    },
    group: (numberOfGroups, groupNum, elm) => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/group.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["item"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.children(childTypesSelector);

        // validate template
        validateChildTypes(childTypes, $placeholder, "group");

        // <item>
        $items.each((itemNum, elm) => {
            templates.group_item(numberOfGroups, groupNum, itemNum, elm)
        });
        
        // (templates.group_item);
        $template.html($placeholder.html());
        $placeholder.replaceWith($template);
    },
    group_item: (numberOfGroups, groupNum, itemNum, elm) => {
        let alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];

        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/group_item.html`;
        let $template = $(readFileSync(templatePath).toString());

        let alphabetIndex = itemNum + numberOfGroups * groupNum;
        let letter = alphabet[alphabetIndex];

        $template.find(".function-group-count").html(`${letter}.`);
        $template.find("[content]").removeAttr("content").html($placeholder.html());
        
        $placeholder.replaceWith($template);
    },
    cheat: elm => {
        let $placeholder = $(elm);

        let templatePath = `${process.env.templatesDir}/cheat.html`;
        let $template = $(readFileSync(templatePath).toString());

        $template.find(".cheat-text").html($placeholder.html())
        $placeholder.replaceWith($template);
    },
    graph_container: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/graph_container.html`;
        let $template = $("<template-container>" + readFileSync(templatePath).toString() + "</template-container>");

        let childTypes = ["top-text", "image-url", "graph-url"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.children(childTypesSelector);

        // validate template
        validateChildTypes(childTypes, $placeholder, "graph_container");

        // <top-text>
        let $topText = $placeholder.find("top-text");
        if($topText.length === 0) {
            $template.find("top-text").remove();
        }
        else {
            $template.find("top-text").replaceWith($topText);
            templates.top_text($template.find("top-text")[0]);
        }

        // <image-url> and <graph-url>
        let imageUrl = $placeholder.find("image-url").html();
        let graphUrl = $placeholder.find("graph-url").html();
        $template.find("[image-url]").removeAttr("image-url").attr("src", imageUrl);
        $template.find("a").attr("href", graphUrl);

        // [image-size-class]
        let imageClass = $placeholder.attr("image-size-class");
        $template.find("[image-size-class]").removeAttr("image-size-class").addClass(imageClass);

        // [push-graph-launcher-right]
        let pushLauncherRight = $placeholder.attr("push-graph-launcher-right") === "true";
        if(pushLauncherRight) {
            $template.find("[push-graph-launcher-right]").addClass("push-right")
        }
        $template.find("[push-graph-launcher-right]").removeAttr("push-graph-launcher-right");

        $placeholder.replaceWith($template.html());
    },
    graph_with_caption: elm => {
        console.log("GRAPH WITH CAPTION!!!!!!!!!!!!!!!!!!!!");

        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/graph_with_caption.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["graph-container", "text-caption"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "graph_with_caption");

        // <graph-container>
        let $graphContainer = $placeholder.find("graph-container");
        $template.find("graph-container").replaceWith($graphContainer);
        templates.graph_container($graphContainer[0]);

        // <text-caption>
        let caption = $placeholder.find("text-caption").html();
        console.log($placeholder.length + " | " + $placeholder[0].tagName + " ||| " + $placeholder.find("text-caption").length);
        $template.find("span").html(caption);

        $placeholder.replaceWith($template);
    }
}

module.exports = {
    applyTemplates: applyTemplates
};