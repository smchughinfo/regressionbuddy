const { readFileSync } = require("fs");
const cheerio = require('cheerio');
const { statSync, readdirSync, unlinkSync } = require("fs");
const { join, sep } = require("path");

const existsSync = filePath => {
    try {
        statSync(filePath);
        return true;
    }
    catch(ex) {
        return false;
    }
};

const isDirectory = path => statSync(path).isDirectory();
const getDirectories = path =>
    readdirSync(path).map(name => join(path, name)).filter(isDirectory);

const isFile = path => statSync(path).isFile();  
const getFiles = path =>
    readdirSync(path).map(name => join(path, name)).filter(isFile);

const getFilesRecursively = path => {
    let dirs = getDirectories(path);
    let files = dirs
        .map(dir => getFilesRecursively(dir)) // go through each directory
        .reduce((a,b) => a.concat(b), []);    // map returns a 2d array (array of file arrays) so flatten
    return files.concat(getFiles(path));
};

const deleteFilesFromDirectory = path => {
    let files = getFiles(path);
    files.forEach(file => {
        unlinkSync(file);
    });
};

const getPostConfig = postNumber => {
    var configPath = `${process.env.postsDir}/${postNumber}/post.json`;
    return JSON.parse(readFileSync(configPath).toString());
}

const getPostNumbers = includeReviewPosts => {    
    var postDirs = getDirectories(process.env.postsDir);
    var posts = postDirs.map(dir => parseInt(dir.split(sep).pop(),10));
    return posts.filter(post => {
        if(includeReviewPosts) {
            return getPostConfig(post);    
        }
        return getPostConfig(post).inReview === false;
    });  
};

const getPostNumbersInReview = getPostsInReview => {    
    return getPostNumbers(true).filter(post => {
        return getPostConfig(post).inReview === true;
    });
};

const getLargestPostNumber = () => {
    return parseInt(getPostNumbers().sort().pop(), 10);
}

const isDev = () => process.env.name === "dev";

const getPostSubjects = (postNumber) => {
    let subjectsPath = `${process.env.postsDir}/${postNumber}/subjects`;
    return getDirectorySubjects(subjectsPath);
};

const orderSubjects = subjects => {
    var subjectOrders = {
        "algebra": 1,
        "trigonometry": 2,
        "calculus": 3,
        "vector_calculus": 4,
        "statistics": 5,
        "linear_algebra": 6
    };

    return subjects.sort((a,b) => {
        return subjectOrders[a] > subjectOrders[b];
    });
};

const getGlossarySubjects = () => {
    let subjectsPath = `${process.env.clientDir}/html/glossary`;
    return getDirectorySubjects(subjectsPath);
};

const getAppendixSubjects = () => {
    let subjectsPath = `${process.env.clientDir}/html/appendix`;
    return getDirectories(subjectsPath).map(dir => dir.split(sep).pop());
};

const getDirectorySubjects = subjectsPath => {
    let allSubjectFiles = getFiles(subjectsPath);
    let subjects = allSubjectFiles.map(path => path.split(sep).pop().replace(".html", ""));
    return subjects;
}

const getRandomInt = (minInclusive, maxInclusive, except) => {
    for(let i = 0; i < 1000; i++) {
        let random = Math.floor(Math.random() * (maxInclusive - minInclusive + 1)) + minInclusive;
        if(except == null || random !== except) {
            return random;
        }
        if(i === 999) {
            throw "ERROR CREATING RANDOM NUMBER";
        }
    }
};

const capatalizeFirstLetterOfEveryWord = word => {
    return word.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

const sortObjectArrayByKey = (objArray, key) => {
    return objArray.sort((a,b) => {
        return a[key] > b[key];
    });
};

const getSimpleTopicString = topicString => {
    topicString = decodeHTML(topicString);
    return topicString.replace(/ /g, "-").replace(/_/g, "-").replace(/,/g, "").replace(/°/g, "").toLowerCase();
}

const getTopicFiles = (subject, topics) => {
    topics = topics
        .filter(topic => typeof topic === "string")
        .map(getSimpleTopicString);

    var allFiles = getFiles(`${process.env.clientDir}/html/appendix/${subject}`);
    var topicFiles = allFiles.filter(file => {
        file = file.replace(/^.*?\./, "");
        file = file.replace(/\.html/, "");
        file = file.replace(/_/g, "-");
        return topics.indexOf(file) !== -1;
    });
    
    return topicFiles;
};

const isCrossTopic = topic => topic instanceof Array;

const getCrossTopic = topic => {
    return {
        subject: topic[0],
        topic: topic[1]
    };
};

const getCrossTopics = (config, targetSubject) => {
    let crossTopics = [];
    for(let subject in config.topics) {
        if(subject !== targetSubject) {
            let subjectCrossTopics = config.topics[subject].filter(topic => {
                let crossTopic = getCrossTopic(topic);
                return crossTopic.subject === targetSubject;
            });
            if(subjectCrossTopics.length > 0) {
                crossTopics = crossTopics.concat(subjectCrossTopics);
            }
        }
    }
    return crossTopics;
};

const getAllCrossTopics = (targetSubject, inReview) => {
    let postNumbers = getPostNumbers(inReview);
    let configs = postNumbers.map(getPostConfig);
    let crossTopics = [];

    // go through each config and find the cross topics that belong to the targetSubject
    for(let i = 0; i < configs.length; i++) {
        let config = configs[i];
        let configCrossTopics = getCrossTopics(config, targetSubject);
        if(configCrossTopics.length > 0) {
            configCrossTopics = configCrossTopics.map(getCrossTopic);
            crossTopics = crossTopics.concat(configCrossTopics)
        }
    }
    
    return crossTopics;
};

const getAppendixFiles = (subject, inReview)  => {
    let postNumbers = getPostNumbers(inReview);
    let configs = postNumbers.map(n => {
        return getPostConfig(n);
    });

    let topics = [];
    configs.forEach(config => {
        let hyphenSubject = subject.replace(/_/g, "-");
        let subjectTopics = getCrossTopics(config, hyphenSubject)
            .map(topic => {
                return getCrossTopic(topic).topic;
            });
        let postTopics = config.topics[hyphenSubject];
        topics = topics.concat(subjectTopics).concat(postTopics);
    });

    return getTopicFiles(subject, topics);
};

const decodeHTML = html => {
    let $ = cheerio.load("<textarea id='decoder'>" + html + "</textarea>");
    return $.root().find("#decoder").text();
};

module.exports = {
    existsSync: existsSync,
    getDirectories: getDirectories,
    deleteFilesFromDirectory: deleteFilesFromDirectory,
    getPostNumbers: getPostNumbers,
    getPostNumbersInReview: getPostNumbersInReview,
    getLargestPostNumber: getLargestPostNumber,
    getFiles: getFiles,
    getFilesRecursively: getFilesRecursively,
    isDev: isDev,
    getPostSubjects: getPostSubjects,
    getGlossarySubjects: getGlossarySubjects,
    getAppendixSubjects: getAppendixSubjects,
    getRandomInt: getRandomInt,
    capatalizeFirstLetterOfEveryWord: capatalizeFirstLetterOfEveryWord,
    getPostConfig: getPostConfig,
    sortObjectArrayByKey: sortObjectArrayByKey,
    orderSubjects: orderSubjects,
    getAppendixFiles: getAppendixFiles,
    getSimpleTopicString: getSimpleTopicString,
    isCrossTopic: isCrossTopic,
    getCrossTopic: getCrossTopic,
    getAllCrossTopics: getAllCrossTopics
};