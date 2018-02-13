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
    let _templates = ["primary-list", "nested-list", "topic", "topic-instance", "topic-definition", "topic-example", "horizontal-group-3", "horizontal-group-4", "graph-with-caption", "empty-graph-with-caption", "li-text", "top-text", "group-carrier", "group", "group-item", "cheat", "graph-container"];
    _templates.forEach(template => {
        $.root().find(template).each((i, elm) => {
            template = template.replace(/-/g, "_");
            templates[template](elm);
        });
    });

    return $.html();
};

const html = elm => {
    return $("<div></div>").append(elm).html();
};

const validateChildTypes = (childTypes, $placeholder, templateName) => {
    let childTypesSelector = childTypes.join(",");
    let $children = $placeholder.children(childTypesSelector);

    // doesnt account for text nodes.
    if($children.length === 0) {
        throw `Could not find a valid child type for template ${templateName}. Using selector ${childTypesSelector}. $placeholder.html() => ${$("<div>").append($placeholder).html()}.`;
    }
    if($children.length != $placeholder.children().length) {
        throw `Invalid child types found for template ${templateName}. Using selector ${childTypesSelector}. $placeholder.html() => ${$("<div>").append($placeholder).html()}.`;
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
        let $topText = $placeholder.children("top-text");
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
        
        let $items = $placeholder.children("item");
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
        let $topText = $placeholder.children("top-text");
        if($topText.length === 0) {
            $template.find("top-text").remove();
        }
        else {
            $template.find("top-text").replaceWith($topText);
            templates.top_text($template.find("top-text")[0]);
        }

        // <text>
        let $text = $placeholder.children("text");
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

        let childTypes = ["group", "top-text", "graph-container"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.children(childTypesSelector);

        // validate template
        validateChildTypes(childTypes, $placeholder, "group_carrier");

        // <top-text>
        let $topText = $placeholder.children("top-text");
        if($topText.length === 0) {
            $template.find("top-text").remove();
        }
        else {
            $template.find("top-text").replaceWith($topText);
            templates.top_text($template.find("top-text")[0]);
        }

        // <graph-container>
        let $graphContainer = $placeholder.children("graph-container");
        if($graphContainer.length > 0) {
            $template.find("graph-container").replaceWith($graphContainer);
        }
        else {
            $template.find("graph-container").remove();
        }

        // <group>
        let $groups = $placeholder.children("group");
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
        let $topText = $placeholder.children("top-text");
        if($topText.length === 0) {
            $template.find("top-text").remove();
        }
        else {
            $template.find("top-text").replaceWith($topText);
            templates.top_text($template.find("top-text")[0]);
        }

        // <image-url>
        let imageUrl = $placeholder.children("image-url").html();
        $template.find("[image-url]").removeAttr("image-url").attr("src", imageUrl);

        // <graph-url>
        let $graphUrl = $placeholder.children("graph-url");
        if($graphUrl.length > 0) {
            let graphUrl = $graphUrl.html();
            $template.find("a").attr("href", graphUrl);
        }
        else {
            $template.find("a").remove();
        }

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
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/graph_with_caption.html`;
        let $template = $("<template-container>" + readFileSync(templatePath).toString() + "</template-container>");

        let childTypes = ["graph-container", "text-header", "caption-text", "caption-html"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "graph_with_caption");

        // <text-header>
        if($placeholder.children("text-header").length > 0) {
            let header = $placeholder.children("text-header").html();
            let $headerContent = $template.find("[header-content]").removeAttr("header-content");
            $headerContent.html(header);

            if($placeholder.children("text-header").is("[bold]")) {
                $headerContent.addClass("bold");
            }
        }
        else {
            $template.find("[header-content]").remove();
        }

        // <graph-container>
        let $graphContainer = $placeholder.children("graph-container");
        $template.find("graph-container").replaceWith($graphContainer);
        templates.graph_container($graphContainer[0]);

        // <caption-text>
        if($placeholder.children("caption-text").length > 0) {
            let caption = $placeholder.children("caption-text").html();
            $template.find("[caption-text]").removeAttr("caption-text").html(caption);
        }
        else {
            $template.find("[caption-text]").remove();
        }

        // <caption-html>
        if($placeholder.children("caption-html").length > 0) {
            let subcaption = $placeholder.children("caption-html").html();
            $template.find("[caption-html]").removeAttr("caption-html").html(subcaption);
        }
        else {
            $template.find("[caption-html]").remove();
        }

        $placeholder.replaceWith($template.html());
    },
    empty_graph_with_caption: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/empty_graph_with_caption.html`;
        let $template = $("<template-container>" + readFileSync(templatePath).toString() + "</template-container>");

        let childTypes = ["text-header", "caption-html"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "empty_graph_with_caption");

        // <text-header>
        if($placeholder.children("text-header").length > 0) {
            let header = $placeholder.children("text-header").html();
            let $headerContent = $template.find("[header-content]").removeAttr("header-content")
            $headerContent.html(header);

            if($placeholder.children("text-header").is("[bold]")) {
                $headerContent.addClass("bold");
            }
        }
        else {
            $template.find("[header-content]").remove();
        }

        // <caption-html>
        if($placeholder.children("caption-html").length > 0) {
            let html = $placeholder.children("caption-html").html();
            $template.find("[content]").removeAttr("content").html(html);
        }
        else {
            $template.find("[content]").remove();
        }

       
        $placeholder.replaceWith($template.html());
    },
    topic_instance: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/topic_instance.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["topic-instance-name", "topic-instance-html", "horizontal-group-3", "horizontal-group-4", "group-carrier"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "topic_instance");

        // <topic-instance-name>
        let $topicName = $placeholder.children("topic-instance-name");
        if($topicName.length > 0) {
            let topicName = $topicName.html();
            $template.find("[topic-instance-name]").removeAttr("topic-instance-name").html(topicName);
        }
        else {
            $template.find("[topic-instance-name]").remove();
        }
        
        // <topic-instance-html>
        let $topicInstanceHTML = $placeholder.children("topic-instance-html");
        if($topicInstanceHTML.length > 0) {
            let topicInstanceHTML = $topicInstanceHTML.html();
            $template.find("[topic-instance-html]").removeAttr("topic-instance-html").html(topicInstanceHTML);
        }
        else {
            $template.find("[topic-instance-html]").remove();
        }

        // <horizontal-group-3>
        let $horizontalGroup3s = $placeholder.children("horizontal-group-3");
        if($horizontalGroup3s.length > 0) {
            let $repeater = $template.find("horizontal-group-3[repeater]");
            let $repeaterParent = $repeater.parent();
            $repeater.removeAttr("repeater").clone();

            $horizontalGroup3s.each((i, elm) => {
                $repeater.after(elm);
                templates.horizontal_group_3(elm);
            });

            $repeater.remove();
        }
        else {
            $template.find("horizontal-group-3[repeater]").remove();
        }

        // <horizontal-group-4>
        let $horizontalGroup4s = $placeholder.children("horizontal-group-4");
        if($horizontalGroup4s.length > 0) {
            let $repeater = $template.find("horizontal-group-4[repeater]");
            let $repeaterParent = $repeater.parent();
            $repeater.removeAttr("repeater").clone();

            $horizontalGroup4s.each((i, elm) => {
                $repeater.after(elm);
                templates.horizontal_group_4(elm);
            });

            $repeater.remove();
        }
        else {
            $template.find("horizontal-group-4[repeater]").remove();
        }

        // <group-carrier>
        let $groupCarrier = $placeholder.children("group-carrier");
        if($groupCarrier.length > 0) {
            let $templateGroupCarrier = $template.find("group-carrier");
            $templateGroupCarrier.replaceWith($groupCarrier);
            templates.group_carrier($groupCarrier[0]);
        }
        else {
            $template.find("group-carrier").remove();
        }

        $placeholder.replaceWith($template);
    },
    topic_definition: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/topic_definition.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["topic-instance"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "topic_definition");

        // <topic-instance>
        let $repeater = $template.find("[repeater]");
        let $repeatContainer = $repeater.parent();
        $repeater.remove();
        let $topicInstances = $placeholder.children("topic-instance");
        $topicInstances.each((i, elm) => {
            let $topicInstance = $(elm);
            $repeatContainer.append($topicInstance);
            templates.topic_instance($topicInstance[0]);
        });

        $placeholder.replaceWith($template);
    },
    topic_example: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/topic_example.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["topic-instance", "horizontal-group-3", "horizontal-group-4"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "topic_example");

        let $repeater = $template.find("[repeater]");
        let $repeatContainer = $repeater.parent();
        $repeater.remove();

        // .size-class
        let sizeClass = $placeholder.attr("size-class");
        $template.removeAttr("size-class").addClass(sizeClass);

        // <topic-instance>
        let $topicInstances = $placeholder.children("topic-instance");
        $topicInstances.each((i, elm) => {
            let $topicInstance = $(elm);
            $repeatContainer.append($topicInstance);
            templates.topic_instance($topicInstance[0]);
        });
        
        // <horizontal-group-3>
        let $horizontalGroup3s = $placeholder.children("horizontal-group-3");
        $horizontalGroup3s.each((i, elm) => {
            let $horizontalGroup = $(elm);
            $repeatContainer.append($horizontalGroup);
            templates.horizontal_group_3($horizontalGroup[0]);
        });

        // <horizontal-group-4>
        let $horizontalGroup4s = $placeholder.children("horizontal-group-4");
        $horizontalGroup4s.each((i, elm) => {
            let $horizontalGroup = $(elm);
            $repeatContainer.append($horizontalGroup);
            templates.horizontal_group_4($horizontalGroup[0]);
        });

        $placeholder.replaceWith($template);
    },
    topic: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/topic.html`;
        let $template = $(readFileSync(templatePath).toString()); // if you wrap this make sure to update the id being set in the <topic-name> section

        let childTypes = ["topic-name", "topic-primer", "topic-eli5", "topic-definition", "topic-example"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "topic");

        // <topic-name>
        let name = $placeholder.children("topic-name").html();
        $template.find("[topic-name]").removeAttr("topic-name").html(name);
        $template.attr("id", name.toLowerCase().replace(/ /g, "-"))

        // <topic-primer>
        let $topicPrimer = $placeholder.children("topic-primer");
        if($topicPrimer.length > 0) {
            let topicPrimer = $topicPrimer.html();
            let $templateTopicPrimer = $template.find("[topic-primer]");
            $templateTopicPrimer.find("[topic-primer]").removeAttr("topic-primer")
            $templateTopicPrimer.html(topicPrimer);
        }
        else {
            $template.find("[topic-primer]").remove();
        }

        // <topic-eli5>
        let $eli5 = $placeholder.children("topic-eli5");
        if($eli5.length > 0) {
            let eli5 = $eli5.html();
            let $templateEli5 = $template.find("[topic-eli5]");
            $templateEli5.find("[topic-eli5]").removeAttr("topic-eli5")
            $templateEli5.find("i").html(eli5);
        }
        else {
            $template.find("[topic-eli5]").remove();
        }

        // <topic-definition>
        let $definition = $placeholder.children("topic-definition");
        if($definition.length > 0) {
            $template.find("[topic-definition]").replaceWith($definition);
            templates.topic_definition($definition[0]);
        }
        else {
            $template.find("[topic-definition]").remove();
        }

        // <topic-example>
        let $example = $placeholder.children("topic-example");
        if($example.length > 0) {
            $template.find("[topic-example]").replaceWith($example);
            templates.topic_example($example[0]);
        }
        else {
            $template.find("[topic-example]").remove();
        }

        // templates <br definition-example-seperator>
        if($definition.length !== 1 || $example.length !== 1) {
            $template.find("[definition-example-seperator]").remove();
        }
        else {
            $template.find("[definition-example-seperator]").removeAttr("definition-example-seperator");
        }

        $placeholder.replaceWith($template);
    },
    horizontal_group_3: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/horizontal-group-3.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["graph-with-caption", "empty-graph-with-caption"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.children(childTypesSelector);

        // validate template
        validateChildTypes(childTypes, $placeholder, "horizontal-group-3");
        if($items.length !== 3) {
            throw `horizontal-group-3 must have three children but has ${$items.length} children.`;
        }

        let $repeater = $template.find("[repeater]");
        let $repeatContainer = $repeater.parent();
        $repeater.removeAttr("repeater").remove();
        $items.each((i, elm) => {
            let $item = $(elm);
            let $repeaterClone = $repeater.clone();
            
            $repeaterClone.append($item);
            $repeatContainer.append($repeaterClone);
        });

        $($template.children(".row").children()).each((i, elm) => {
            $groupItem = $(elm);
            $groupItem.children(childTypesSelector).each((i, elm) => {
                templates[elm.tagName.replace(/-/g, "_")](elm);
            });
        });

        $placeholder.replaceWith($template);
    },
    horizontal_group_4: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/horizontal-group-4.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["graph-with-caption", "empty-graph-with-caption"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.children(childTypesSelector);

        // validate template
        validateChildTypes(childTypes, $placeholder, "horizontal-group-4");
        if($items.length !== 4) {
            throw `horizontal-group-4 must have three children but has ${$items.length} children.`;
        }

        let $repeater = $template.find("[repeater]");
        let $repeatContainer = $repeater.parent();
        $repeater.removeAttr("repeater").remove();
        $items.each((i, elm) => {
            let $item = $(elm);
            let $repeaterClone = $repeater.clone();
            
            $repeaterClone.append($item);
            $repeatContainer.append($repeaterClone);
        });

        $($template.children(".row").children()).each((i, elm) => {
            $groupItem = $(elm);
            $groupItem.children(childTypesSelector).each((i, elm) => {
                templates[elm.tagName.replace(/-/g, "_")](elm);
            });
        });

        $placeholder.replaceWith($template);
    }
}

module.exports = {
    applyTemplates: applyTemplates
};