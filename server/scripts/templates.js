// *cheerio can't find elements inside of a <template> tag.
// each template is completely responsible for validating its child elements.

const { readFileSync, writeFileSync } = require("fs");
const cheerio = require('cheerio');

const applyTemplates = html => {
    $ = cheerio.load(html);

     // list templates in the order they are applied.
     // if  on occassion a template1 is inside template2
     // and on occassion b template2 is inside template1
     // ...then idk.
    let _templates = ["primary-list", "nested-list", "topic", "topic-instance", "topic-definition", "topic-example", "horizontal-group-3", "horizontal-group-4", "graph", "empty-graph", "li-text", "top-text", "group-carrier", "group", "group-item", "cheat"];
    _templates.forEach(template => {
        $.root().find(template).each((i, elm) => {
            template = template.replace(/-/g, "_");
            templates[template](elm);
        });
    });

    trimSpace($); // <li trim-space> foo</li> -> <li>foo</li> 

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

const trimSpace = $ => {
    function trimSpace(i, elm) {
        let $elm = $(elm);
        $elm.children().each(trimSpace);
        $elm.removeAttr("trim-space")
        // base case
        $elm.html($elm.html().trim());
    }
    $.root().find("[trim-space]").each(trimSpace);
};

let templates = {
    primary_list: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/primary_list.html`;
        let $template = $(readFileSync(templatePath).toString());
        
        let childTypes = ["nested-list", "group-carrier", "li-text", "graph"];
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
        let $template = $("<template-container>" + readFileSync(templatePath).toString() + "</template-container>");
    
        let childTypes = ["top-text", "item"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "nested_list");    

        // [li-medium-bottom-margin]
        let isMediumVerticalMargin = $placeholder.is("[li-medium-bottom-margin]");
        if(isMediumVerticalMargin) {
            $template.find(".list-group").addClass("li-medium-bottom-margin")
        }

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

            let isGraphWithCaption = $item.children("graph").length > 0;
            if(isGraphWithCaption) {
                // <graph>
                let $graphWithCaptionContainer = $item.find("graph");
                $content.append($graphWithCaptionContainer);
                templates.graph($graphWithCaptionContainer[0]);
            }
            else {
                // text nodes
                let isNoVerticalMargin = $item.is("[no-vertical-margin]");
                let isVerticalMarginSmallTopOnly = $item.is("[latex-vertical-margin-small-top-only]");
                if(isNoVerticalMargin) {
                    $content.addClass("no-vertical-margin");
                }
                else if(isVerticalMarginSmallTopOnly) {
                    $content.addClass("latex-vertical-margin-small-top-only");
                }

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

            // [latex-vertical-margin-small-top-only]
            let isVerticalMarginSmallTopOnly = $text.is("[latex-vertical-margin-small-top-only]");
            if(isVerticalMarginSmallTopOnly) {
                $template.find("span").addClass("latex-vertical-margin-small-top-only");
            }
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

        // [hide-index]
        let hideIndex = $placeholder.is("[hide-index]");

        // [height-class]
        let hasHeightClass = $placeholder.is("[height-class]");
        if(hasHeightClass) {
            let heightClass = $placeholder.attr("height-class");
            $template.addClass(heightClass);
        }

        // <top-text>
        let $topText = $placeholder.children("top-text");
        if($topText.length === 0) {
            $template.find("top-text").remove();
        }
        else {
            $template.find("top-text").replaceWith($topText);
            templates.top_text($template.find("top-text")[0]);
        }

        // <group>
        let $groups = $placeholder.children("group");
        $groups.each((i, groupElm) => {
            let numberOfGroups = $groups.length;
            templates.group(hideIndex, numberOfGroups, i, groupElm);
        });

        $template.append($placeholder.html());
        $placeholder.replaceWith($template);
    },
    group: (hideIndex, numberOfGroups, groupNum, elm, row) => {
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
            let itemsInThisGroup = $items.length;
            templates.group_item(hideIndex, numberOfGroups, itemsInThisGroup, groupNum, itemNum, elm)
        });
        
        // (templates.group_item);
        $template.html($placeholder.html());
        $placeholder.replaceWith($template);
    },
    group_item: (hideIndex, numberOfGroups, itemsInThisGroup, groupNum, itemNum, elm) => {
        let alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];

        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/group_item.html`;
        let $template = $(readFileSync(templatePath).toString());

        // math is a little brittle here. if groups ever have different numbers of items then? maybe put in a blank element.
        let alphabetIndex =  groupNum * itemsInThisGroup + itemNum;
        let letter = alphabet[alphabetIndex];

        if(hideIndex) {
            $template.find(".function-group-count").remove();
        }
        else {
            $template.find(".function-group-count").html(`${letter}.`);
        }

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
    graph: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/graph.html`;
        let $template = $("<template-container>" + readFileSync(templatePath).toString() + "</template-container>");

        let childTypes = ["text-header", "image-url", "graph-url", "caption-text", "caption-html", "caption-html-after"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "graph");

        // <text-header>
        if($placeholder.children("text-header").length > 0) {
            let header = $placeholder.children("text-header").html();
            let $headerContent = $template.find("[header-content]").removeAttr("header-content");
            $headerContent.html(header);

            if($placeholder.children("text-header").is("[bold]")) {
                $headerContent.addClass("bold");
            }
            if($placeholder.children("text-header").is("[wider-line]")) {
                $headerContent.addClass("wider-line");
            }
            if($placeholder.children("text-header").is("[center]")) {
                $headerContent.addClass("text-center");
            }
            if($placeholder.children("text-header").is("[bottom-margin]")) {
                $headerContent.addClass("text-center");
            }
        }
        else {
            $template.find("[header-content]").remove();
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

        // <caption-text>
        let $placeholderCaptionText = $placeholder.children("caption-text");
        if($placeholderCaptionText.length > 0) {
            let caption = $placeholderCaptionText.html();
            let $templateCaptionTextContainer = $template.find("[caption-text]");
            let $templateCaptionText = $templateCaptionTextContainer.find(".caption-text");
            
            $templateCaptionTextContainer.removeAttr("caption-text");
            $templateCaptionText.html(caption);

            let isVerticalMarginMediumTopOnly = $placeholderCaptionText.is("[latex-vertical-margin-medium-top-only]");
            if(isVerticalMarginMediumTopOnly) {
                $templateCaptionText.addClass("latex-vertical-margin-medium-top-only");
            }
        }
        else {
            $template.find("[caption-text]").remove();
        }

        // <caption-html>
        let $placeholderCaptionHTML = $placeholder.children("caption-html");
        if($placeholderCaptionHTML.length > 0) {
            let captionHTML = $placeholder.children("caption-html").html();
            $template.find("[caption-html]").removeAttr("caption-html").html(captionHTML);
        }
        else {
            $template.find("[caption-html]").remove();
        }

        // <caption-html-after>
        let $placeholderCaptionHTMLAfter = $placeholder.children("caption-html-after");
        if($placeholderCaptionHTMLAfter.length > 0) {
            let subCaptionHTML = $placeholder.children("caption-html-after").html();
            let $templateCaptionHTMLAfter = $template.find("[caption-html-after]");
            $templateCaptionHTMLAfter.removeAttr("caption-html-after").html(subCaptionHTML);
            if($placeholderCaptionHTMLAfter.is("[height-100]")) {
                $templateCaptionHTMLAfter.addClass("height-100");
            }
        }
        else {
            $template.find("[caption-html-after]").remove();
        }

        $placeholder.replaceWith($template.html());
    },
    empty_graph: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/empty_graph.html`;
        let $template = $("<template-container>" + readFileSync(templatePath).toString() + "</template-container>");

        let childTypes = ["text-header", "caption-html"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "empty_graph");

        // <text-header>
        if($placeholder.children("text-header").length > 0) {
            let header = $placeholder.children("text-header").html();
            let $headerContent = $template.find("[header-content]").removeAttr("header-content")
            $headerContent.html(header);

            if($placeholder.children("text-header").is("[bold]")) {
                $headerContent.addClass("bold");
            }
            if($placeholder.children("text-header").is("[wider-line]")) {
                $headerContent.addClass("wider-line");
            }
            if($placeholder.children("text-header").is("[center]")) {
                $headerContent.addClass("text-center");
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

        let childTypes = ["topic-instance", "diagram-by-example"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "topic_definition");
        
        let $repeater = $template.find("[repeater]");
        let $repeatContainer = $repeater.parent();
        $repeater.remove();

        // <topic-instance>
        let $topicInstances = $placeholder.children("topic-instance");
        $topicInstances.each((i, elm) => {
            let $topicInstance = $(elm);
            $repeatContainer.append($topicInstance);
            templates.topic_instance($topicInstance[0]);
        });

        // <diagram-by-example>
        let $diagramByExamples = $placeholder.children("diagram-by-example");
        $diagramByExamples.each((i, elm) => {
            let $diagramByExample = $(elm);
            $repeatContainer.append($diagramByExample);
            templates.diagram_by_example($diagramByExample[0]);
        });

        $placeholder.replaceWith($template);
    },
    topic_example: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/topic_example.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["topic-instance", "horizontal-group-3", "horizontal-group-4", "diagram-by-example"];

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

        // <diagram-by-example>
        let $diagramByExamples = $placeholder.children("diagram-by-example");
        $diagramByExamples.each((i, elm) => {
            let $diagramByExample = $(elm);
            $repeatContainer.append($diagramByExample);
            templates.diagram_by_example($diagramByExample[0]);
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

        let childTypes = ["graph", "empty-graph"];
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

        let childTypes = ["graph", "empty-graph"];
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
    },
    diagram_by_example: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/diagram_by_example.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["html-header", "diagram", "group-carrier"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.children(childTypesSelector);

        // validate template
        validateChildTypes(childTypes, $placeholder, "diagram-by-example");

        // <html-header>
        let headerHTML = $placeholder.find("html-header").html();
        $template.find("html-header").replaceWith(headerHTML);

        // <diagram>
        let imageUrl = $placeholder.find("diagram").html();
        let imageSizeClass = $placeholder.find("diagram").attr("image-size-class");
        $template.find("img").attr("src", imageUrl).addClass(imageSizeClass);

        // <function-group-carroer>
        let $placeholderGroupCarrier = $placeholder.find("group-carrier");
        let $templateGroupCarrier = $template.find("group-carrier");
        $templateGroupCarrier.replaceWith($placeholderGroupCarrier);
        templates.group_carrier($placeholderGroupCarrier[0]);

        $placeholder.replaceWith($template);
    }
}

module.exports = {
    applyTemplates: applyTemplates
};