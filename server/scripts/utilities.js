const { readFileSync } = require("fs");

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

const getTopicFiles = (subject, topics) => {
    topics = topics.map(topic => topic.replace(/ /g, "_").replace(/-/g, "_").replace(/,/g, "").toLowerCase());

    var allFiles = getFiles(`${process.env.clientDir}/html/appendix/${subject}`);
    var topicFiles = allFiles.filter(file => {
        file = file.replace(/^.*?\./, "");
        file = file.replace(/\.html/, "");
        return topics.indexOf(file) !== -1;
    });
    
    return topicFiles;
};

const getAppendixFiles = (subject, inReview)  => {
    var postNumbers = getPostNumbers(inReview);
    var configs = postNumbers.map(n => {
        return getPostConfig(n);
    });

    var topics = [];
    configs.forEach(config => {
        var postTopics = config.topics[subject.replace(/_/g, "-")]
        topics = topics.concat(postTopics);
    });

    return getTopicFiles(subject, topics);
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
    getAppendixFiles: getAppendixFiles
};