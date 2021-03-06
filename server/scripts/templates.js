// *cheerio can't find elements inside of a <template> tag.
// each template is completely responsible for validating its child elements.

const { readFileSync, writeFileSync } = require("fs");
const cheerio = require('cheerio');
const { getSimpleTopicString } = require('./utilities.js')
const mathjaxTransforms = require('./mathjax_transforms.js');

let $ = null;

const applyTemplates = (html, partial) => {
    $ = cheerio.load(html);

     // list templates in the order they are applied.
     // if  on occassion a template1 is inside template2
     // and on occassion b template2 is inside template1
     // ...then idk.
    let _templates = ["matrix", "primary-list", "nested-list", "topic", "topic-instance", "topic-definition", "topic-example", "horizontal-group-3", "horizontal-group-4", "wrapped-graph", "graph", "empty-graph", "li-text", "top-text", "group-carrier", "group", "group-item", "cheat"];
    _templates.forEach(template => {
        $.root().find(template).each((i, elm) => {
            template = template.replace(/-/g, "_");
            templates[template](elm);
        });
    });

    trimSpace($); // <li trim-space> foo</li> -> <li>foo</li> 

    if(partial) {
        let $tmp = $("<div>" + $.html() + "</div>");
        $tmp.remove("html");
        return $tmp.html();
    }
    else {
        return $.html();
    }
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
    matrix: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/matrix.html`;
        let $template = $(readFileSync(templatePath).toString());

        let innerHTML = $(elm).html();
        let forceNegativeSigns = $(elm).is("[force-negative-signs]");
        let transformedMathjax = mathjaxTransforms.matrix(innerHTML, forceNegativeSigns);
        $template.html(transformedMathjax);

        $(elm).replaceWith($template);
    },
    primary_list: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/primary_list.html`;
        let $template = $(readFileSync(templatePath).toString());
        
        let childTypes = ["nested-list", "group-carrier", "li-text", "wrapped-graph", "graph", "little-pseudo-table"];
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
    
        let childTypes = ["top-text", "disclaimer", "item"];

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

        // <disclaimer>
        let $disclaimer = $placeholder.children("disclaimer");
        if( $disclaimer.length === 0) {
            $template.find("[disclaimer]").remove();
        }
        else {
            let disclaimer = $disclaimer.html();
            $template.find("[disclaimer]").removeAttr("disclaimer").html(disclaimer);
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

        let childTypes = ["top-text", "text", "html-content", "disclaimer"];

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
            $template.find("span[text-span]").remove();
        }
        else {
            // this else block, and really all of top_text needs refactored. the way span and cheat are being handled is a mess.
            let text = $text.html();
            $template.find("span[text-span]").html(text);

            // [latex-vertical-margin-small-top-only]
            let isVerticalMarginSmallTopOnly = $text.is("[latex-vertical-margin-small-top-only]");
            if(isVerticalMarginSmallTopOnly) {
                $template.find("span[text-span]").addClass("latex-vertical-margin-small-top-only");
            }

            // [cheat="factor"]
            let cheat = $text.attr("cheat");
            if(cheat !== undefined) {
                let $cheat = $("<cheat>");
                $template.find("span[text-span]").append($cheat);
                $cheat.html(cheat);
                templates.cheat($cheat[0]);
            }

            $template.find("span[text-span]").removeAttr("text-span");
        }
        
        // <html-content>
        let $htmlContent = $placeholder.children("html-content");
        if( $htmlContent.length === 0) {
            $template.find("html-content").remove();
        }
        else {
            $template.find("html-content").replaceWith($htmlContent.html());
        }

        // <disclaimer>
        let $disclaimer = $placeholder.children("disclaimer");
        if( $disclaimer.length === 0) {
            $template.find("[disclaimer]").remove();
        }
        else {
            let disclaimer = $disclaimer.html();
            $template.find("[disclaimer]").removeAttr("disclaimer").html(disclaimer);
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
        else {
            throw "group_carrier should have a height class.";
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

        // count-horizontally
        let isCountHorizontally = $placeholder.is("[count-horizontally]");
        if(isCountHorizontally) {
            // TODO: console.log("--- IMPLEMENT COUNT-HORIZONTALLY ---");
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

        // [left]1
        let isLeft = $placeholder.is("[left]");
        if(isLeft)
        {
            $template.find(".graph").removeClass("text-center").addClass("text-left");
        }

        // <image-url>
        let imageUrl = $placeholder.children("image-url").html();
        $template.find("[image-url]").removeAttr("image-url").attr("data-src", imageUrl);

        // <graph-url>
        let $graphUrl = $placeholder.children("graph-url");
        if($graphUrl.length > 0) {
             // <open_graph_button> 
            let $openGraphButton = $template.find("open-graph-button");
            let pushLauncherRight = $placeholder.attr("push-graph-launcher-right") === "true";
            let graphUrl = $graphUrl.html();
            templates.open_graph_button($openGraphButton[0], graphUrl, pushLauncherRight);
        }
        else {
            $template.find("open-graph-button").remove();
        }

        // [image-size-class]
        let imageClass = $placeholder.attr("image-size-class");
        $template.find("[image-size-class]").removeAttr("image-size-class").addClass(imageClass);

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

        let childTypes = ["text-header", "caption-html", "steps", "graph"];

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
            if($placeholder.children("text-header").is("[pseudo-topic-instance-header]")) {
                $headerContent.addClass("pseudo-topic-instance-header");
            }
        }
        else {
            $template.find("[header-content]").remove();
        }

        // <caption-html>
        if($placeholder.children("caption-html").length > 0) {
            let html = $placeholder.children("caption-html").html();
            let $content = $template.find("[content]").removeAttr("content")

            // [disallow-grow]
            if($placeholder.children("caption-html").is("[disallow-grow]")) {
                $content.addClass("disallow-grow");
            }

            $content.html(html);
        }
        else {
            $template.find("[content]").remove();
        }

        // <steps>
        let $steps = $placeholder.children("steps");
        if($steps.length > 0) {
            let $templateSteps = $template.find("steps");
            $templateSteps.replaceWith($steps);
            templates.steps($steps[0]);
        }
        else {
            $template.find("steps").remove();
        }
        
        // <graph>
        let $graph = $placeholder.children("graph");
        if($graph.length > 0) {
            let $templateGraph = $template.find("graph");
            $templateGraph.replaceWith($graph);
            templates.graph($graph[0]);
        }
        else {
            $template.find("graph").remove();
        }
       
        $placeholder.replaceWith($template.html());
    },
    topic_instance: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/topic_instance.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["topic-instance-name", "topic-instance-html", "horizontal-group-2", "horizontal-group-3", "horizontal-group-4", "group-carrier", "three-group", "graph", "wrapped-graph", "steps"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "topic_instance");

        // [no-bottom-padding]
        let isNoBottomPadding = $placeholder.is("[no-bottom-padding]");
        if(isNoBottomPadding) {
            $template.addClass("no-bottom-padding");
        }

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

        // <horizontal-group-2>
        let $horizontalGroup2s = $placeholder.children("horizontal-group-2");
        if($horizontalGroup2s.length > 0) {
            let $repeater = $template.find("horizontal-group-2[repeater]");
            let $repeaterParent = $repeater.parent();
            $repeater.removeAttr("repeater").clone();

            $horizontalGroup2s.each((i, elm) => {
                $repeater.after(elm);
                templates.horizontal_group_2(elm);
            });

            $repeater.remove();
        }
        else {
            $template.find("horizontal-group-2[repeater]").remove();
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

        // <three-group>
        let $threeGroup = $placeholder.children("three-group");
        if($threeGroup.length > 0) {
            let $templateThreeGroup = $template.find("three-group");
            $templateThreeGroup.replaceWith($threeGroup);
            templates.three_group($threeGroup[0]);
        }
        else {
            $template.find("three-group").remove();
        }

        // <graph>
        let $graph = $placeholder.children("graph");
        if($graph.length > 0) {
            let $templateGraph = $template.find("graph");
            $templateGraph.replaceWith($graph);
            templates.graph($graph[0]);
        }
        else {
            $template.find("graph").remove();
        }

        // <wrapped-graph>
        let $wrappedGraph = $placeholder.children("wrapped-graph");
        if($wrappedGraph.length > 0) {
            let $templateWrappedGraph = $template.find("wrapped-graph");
            $templateWrappedGraph.replaceWith($wrappedGraph);
            templates.wrapped_graph($wrappedGraph[0]);
        }
        else {
            $template.find("wrapped-graph").remove();
        }

        // <steps>
        let $steps = $placeholder.children("steps");
        if($steps.length > 0) {
            let $templateSteps = $template.find("steps");
            $templateSteps.replaceWith($steps);
            templates.steps($steps[0]);
        }
        else {
            $template.find("steps").remove();
        }

        $placeholder.replaceWith($template);
    },
    topic_definition: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/topic_definition.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["topic-instance", "diagram-by-example", "wrapped-graph"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "topic_definition");
        
        let $repeater = $template.find("[repeater]");
        let $repeatContainer = $repeater.parent();
        $repeater.remove();

        // .size-class
        let sizeClass = $placeholder.attr("size-class");
        $template.removeAttr("size-class").addClass(sizeClass);

        // <diagram-by-example>
        let $diagramByExamples = $placeholder.children("diagram-by-example");
        $diagramByExamples.each((i, elm) => {
            let $diagramByExample = $(elm);
            $repeatContainer.append($diagramByExample);
            templates.diagram_by_example($diagramByExample[0]);
        });

        // <topic-instance>
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
        $template.attr("id", getSimpleTopicString(name));

        // <topic-primer>
        let $topicPrimer = $placeholder.children("topic-primer");
        if($topicPrimer.length > 0) {
            let topicPrimer = $topicPrimer.html();
            let $templateTopicPrimer = $template.find("[topic-primer]");
            $templateTopicPrimer.removeAttr("topic-primer")
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
            $templateEli5.removeAttr("topic-eli5")
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

        // [deferred]
        let isDeferred = $placeholder.is("[deferred]");
        if(isDeferred) {
            $template
                .find(".alert")
                .removeClass("alert-info")
                .removeClass("alert-success")
                .addClass("alert-warning");
            $template
                .find("h4")
                .append(" (this topic will be covered in a more appropriate context later on)");
        }

        $placeholder.replaceWith($template);
    },
    horizontal_group_2: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/horizontal_group_2.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["graph", "empty-graph"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.children(childTypesSelector);

        // validate template
        validateChildTypes(childTypes, $placeholder, "horizontal-group-3");
        if($items.length !== 2) {
            throw `horizontal-group-2 must have two children but has ${$items.length} children.`;
        }

        let sizeClass = $placeholder.attr("size-class");
        $template.addClass(sizeClass);

        // [wide] and [extra-wide]
        let isWide = $placeholder.is("[wide]");
        let isExtraWide = $placeholder.is("[extra-wide]");
        if(isWide) {
            $template.addClass("wide-horizontal-group-2-container")
            $template.find("[wide]").removeAttr("wide");
            $template.find("[normal]").remove();
            $template.find("[extra-wide]").remove();
        }
        else if(isExtraWide) {
            $template.addClass("extra-wide-horizontal-group-2-container")
            $template.find("[extra-wide]").removeAttr("extra-wide");
            $template.find("[normal]").remove();
            $template.find("[wide]").remove();
        }
        else {
            $template.addClass("normal-horizontal-group-2-container")
            $template.find("[normal]").removeAttr("normal");
            $template.find("[wide]").remove();
            $template.find("[extra-wide]").remove();
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

        $items.each((i, elm) => {
            let $placeholderItem = $(elm);
            let $templateItem = $template.find(`[item-${i+1}]`).removeAttr(`item-${i+1}`);
            $templateItem.append($placeholderItem);

            if(elm.tagName === "graph") {
                templates.graph(elm);
            }
            else if (elm.tagName === "empty-graph") {
                templates.empty_graph(elm);
            }
        });

        $placeholder.replaceWith($template);
    },
    horizontal_group_3: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/horizontal_group_3.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["graph", "empty-graph"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.children(childTypesSelector);

        // validate template
        validateChildTypes(childTypes, $placeholder, "horizontal-group-3");
        if($items.length !== 3) {
            throw `horizontal-group-3 must have three children but has ${$items.length} children.`;
        }

        // [wide] and [extra-wide]
        let isWide = $placeholder.is("[wide]");
        let isExtraWide = $placeholder.is("[extra-wide]");
        if(isWide) {
            $template.find(".horizontal-group-3-container").addClass("wide-horizontal-group-3-container")
            $template.find("[wide]").removeAttr("wide");
            $template.find("[normal]").remove();
            $template.find("[extra-wide]").remove();
        }
        else if(isExtraWide) {
            $template.find(".horizontal-group-3-container").addClass("extra-wide-horizontal-group-3-container")
            $template.find("[extra-wide]").removeAttr("extra-wide");
            $template.find("[normal]").remove();
            $template.find("[wide]").remove();
        }
        else {
            $template.find("[normal]").removeAttr("normal");
            $template.find("[wide]").remove();
            $template.find("[extra-wide]").remove();
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
        let templatePath = `${process.env.templatesDir}/horizontal_group_4.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["graph", "empty-graph"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.children(childTypesSelector);

        // validate template
        validateChildTypes(childTypes, $placeholder, "horizontal-group-4");
        if($items.length !== 4) {
            throw `horizontal-group-4 must have four children but has ${$items.length} children.`;
        }

        $items.each((i, elm) => {
            let $placeholderItem = $(elm);
            let $templateItem = $template.find(`[item-${i+1}]`).removeAttr(`item-${i+1}`);
            $templateItem.append($placeholderItem);

            if(elm.tagName === "graph") {
                templates.graph(elm);
            }
            else if (elm.tagName === "empty-graph") {
                templates.empty_graph(elm);
            }
        });

        $placeholder.replaceWith($template);
    },
    diagram_by_example: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/diagram_by_example.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["html-header", "diagram", "diagram-url", "group-carrier", "html-content"];
        let childTypesSelector = childTypes.join(",");
        let $items = $placeholder.children(childTypesSelector);

        // validate template
        validateChildTypes(childTypes, $placeholder, "diagram-by-example");

        // [break-point-class]
        let hasBreakPointClass = $placeholder.is("[break-point-class]");
        if(hasBreakPointClass) {
            let breakPointClass = $placeholder.attr("break-point-class");
            $template.addClass(breakPointClass);
        }
        else {
            throw "diagram_by_example should have a break point class.";
        }

        // <html-header>
        let headerHTML = $placeholder.find("html-header").html();
        $template.find("html-header").replaceWith(headerHTML);

        // <diagram>
        let imageUrl = $placeholder.find("diagram").html();
        let imageSizeClass = $placeholder.find("diagram").attr("image-size-class");
        let $diagram = $template.find("[image-url]")
        $diagram.removeAttr("image-url").attr("data-src", imageUrl).addClass(imageSizeClass);

        // <diagram-url>
        let $diagramUrl = $placeholder.children("diagram-url");
        if($diagramUrl.length > 0) {
             // <open_graph_button> 
            let $openGraphButton = $template.find("open-graph-button");
            let diagramUrl = $diagramUrl.html();
            templates.open_graph_button($openGraphButton[0], diagramUrl);
        }
        else {
            $template.find("open-graph-button").remove();
        }

        // <function-group-carrier>
        let $placeholderGroupCarrier = $placeholder.find("group-carrier");
        if($placeholderGroupCarrier.length > 0) {
            let $templateGroupCarrier = $template.find("group-carrier");
            $templateGroupCarrier.replaceWith($placeholderGroupCarrier);
            templates.group_carrier($placeholderGroupCarrier[0]);
        }
        else {
            $template.find("group-carrier").remove();
        }

        // <html-content>
        let $placeholderHtmlContent = $placeholder.find("html-content");
        if($placeholderHtmlContent.length > 0) {
            let htmlContent = $placeholderHtmlContent.html();
            $templateHtmlContent = $template.find("html-content");
            $templateHtmlContent.replaceWith(htmlContent);
        }
        else {
            $template.find("html-content").remove();
        }

        $placeholder.replaceWith($template);
    },
    three_group: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/three_group.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["three-group-html", "item"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "three-group");

        // <three-group-html>
        let threeGroupHtml = $placeholder.find("three-group-html").html();
        $template.find(".three-group-html").html(threeGroupHtml);
        
        // <item>
        let $items = $placeholder.find("item"); 
        let $repeater = $template.find("[repeater]");
        $repeater.removeAttr("repeater").remove();
        if($items.length === 3) {
            $items.each((i, elm) => {
                let $item = $(elm);
                let $repeaterClone = $repeater.clone();

                $repeaterClone.html($item.html());
                $template.append($repeaterClone);
            });
        }
        else {
            throw "three_group must have three items."
        }

        $placeholder.replaceWith($template);
    },
    open_graph_button: (elm, url, pushRight) => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/open_graph_button.html`;
        let $template = $(readFileSync(templatePath).toString());

        $template.attr("href", url);

        if(pushRight) {
            $template.addClass("push-right")
        }
        $template.removeAttr("push-graph-launcher-right"); 
        
        $placeholder.replaceWith($template);
    },
    little_pseudo_table: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/little_pseudo_table.html`;
        let $template = $("<template-container>" + readFileSync(templatePath).toString() + "</template-container>");

        let childTypes = ["top-text", "column"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "little-pseudo-table");

        // [break-point-class]
        let hasBreakPointClass = $placeholder.is("[break-point-class]");
        if(hasBreakPointClass) {
            let breakPointClass = $placeholder.attr("break-point-class");
            $template.find("[break-point-class]").addClass(breakPointClass).removeAttr("break-point-class");
        }
        else {
            throw "little_pseudo_table should have a break point class.";
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

        // <column>
        let $columns = $placeholder.children("column");
        let $repeater = $template.find("[repeater]").removeAttr("repeater").remove();
        $columns.each((i, elm) => {
            let header = $(elm).find("header").html();
            let cell = $(elm).find("cell").html();
            let $repeaterClone = $repeater.clone();
            
            $repeaterClone.find("[header]").removeAttr("header").html(header);
            $repeaterClone.find("[cell]").removeAttr("cell").html(cell);

            $template.find(".little-pseudo-table").append($repeaterClone);
        });

        $placeholder.replaceWith($template.html());
    },
    wrapped_graph: elm => {
        /* the normal graph has no container. this graph is wrapped in a container. */
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/wrapped_graph.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["graph"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "wrapped_graph");

        // <graph>
        let $graph = $placeholder.find("graph");
        $template.find("graph").replaceWith($graph);
        templates.graph($graph[0]);
        
        $placeholder.replaceWith($template);
    },
    steps: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/steps.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["step"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "steps");

        let $repeater = $template.find("[repeater]");
        let $repeatContainer = $repeater.parent();
        $repeater.remove();
        $repeater.removeAttr("repeater");

        // <step>
        let $steps = $placeholder.find("step");
        if($steps.length === 0) {
            throw "steps must have at least one step";
        }
        else {
            let $repeaterClone = $repeater.clone();
            $steps.each((i, elm) => {
                let $step = $(elm);
                let $repeaterClone = $repeater.clone();
                $repeaterClone.append($step);
                templates.step(i + 1, elm);
    
                $repeatContainer.append($repeaterClone);
            });
        }

        $placeholder.replaceWith($template);
    },
    step: (i, elm) => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/step.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = ["instructions", "matrix-with-operation", "actions-html"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "step");

        // number
        let $templateNumber = $template.find("[number]").removeAttr("number");
        $templateNumber.html(`Step ${i}:`);

        // <instructions>
        let $instructions = $placeholder.find("instructions");
        if($instructions.length === 0) {
            throw "step must have instructions";
        }
        else {
            let instructions = $instructions.html();
            let $templateInstructions = $template.find("[instructions]").removeAttr("instructions");
            $templateInstructions.html(instructions);
        }

        // <matrix-with-operation>
        let $actions = $placeholder.find("actions-html");
        let $matrixWithOperation = $placeholder.find("matrix-with-operation");

        let isActions = $actions.length === 1 && $matrixWithOperation.length === 0;
        let isMatrixWithOperation = $actions.length === 0 && $matrixWithOperation.length > 0; // it can have more than one matrix-with-operation per step.
        let isInvalid = !isActions && !isMatrixWithOperation;                

        if(isInvalid) {
            throw "step must have only actions-html or only matrix-with-operation"
        }

        // [full-width]
        let isFullWidth = $placeholder.is("[full-width]");
        if(isFullWidth) {
            $template.find("[full-width]").attr("colspan", "2");
            $template.find("[not-full-width]").remove();
        }
        $template.find("[full-width]").removeAttr("full-width");
        $template.find("[not-full-width]").removeAttr("not-full-width");

        // [double-vertical-padding]
        let isDoubleVerticalMargin = $placeholder.is("[double-vertical-padding]");
        if(isDoubleVerticalMargin) {
            $template.addClass("double-step-vertical-padding");
        }

        let $templateActions = $template.find("[actions-html]").removeAttr("actions-html");
        if(isActions) {
            // <actions-html>
            $templateActions.html($actions.html());
        }
        else if(isMatrixWithOperation) {
            // <matrix-with-operation>
            $templateActions.html(""); // being consistent. below we append but in actions-html it does a .html('foo').
            $matrixWithOperation.each((i, elm) => {
                // $tmp is used to contain $matrixWithOperation because after the template
                // is applied i wasn't able to use the same reference for $templateActions.html(myTemplatedElement);
                let $tmp = $("<div>").append(elm);
                templates.matrix_with_operation(elm);
                $templateActions.append($tmp.html());
            });
        }

        $placeholder.replaceWith($template);
    },
    matrix_with_operation: elm => {
        let $placeholder = $(elm);
        let templatePath = `${process.env.templatesDir}/matrix_with_operation.html`;
        let $template = $(readFileSync(templatePath).toString());

        let childTypes = [".matrix", "operation"];

        // validate template
        validateChildTypes(childTypes, $placeholder, "matrix-with-operation");

        // <matrix> gets done before the non-mathjax templates. so by this time it has already been transformed into regular html.
        let $matrix = $placeholder.find(".matrix");
        if($matrix.length === 0) {
            throw "matrix_with_operation must have a matrix"
        }
        else {
            $template.find("matrix").replaceWith($matrix);
        }

        // <operation>
        let $operation = $placeholder.find("operation");
        if($operation.length === 0) {
            throw "matrix_with_operation must have an operation";
        }
        else {
            let operation = $operation.html();
            let $templateOperation = $template.find("[operation]").removeAttr("operation");
            $templateOperation.html(operation);
        }

        $placeholder.replaceWith($template);
    }
}

module.exports = {
    applyTemplates: applyTemplates
};