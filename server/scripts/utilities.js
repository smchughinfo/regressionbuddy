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

const getPostNumbers = () => {    
    var postDirs = getDirectories(process.env.postsDir);
    return postDirs.map(dir => parseInt(dir.split(sep).pop(),10));
};

const getLargestPostNumber = () => parseInt(getPostNumbers().sort().pop(), 10);

const isDev = () => process.env.name === "dev";

const getPostSubjects = (postNumber) => {
    let subjectsPath = `${process.env.postsDir}/${postNumber}/subjects`;
    return getDirectorySubjects(subjectsPath);
};

const getGlossarySubjects = () => {
    let subjectsPath = `${process.env.clientDir}/html/glossary`;
    return getDirectorySubjects(subjectsPath);
};

const getAppendixSubjects = () => {
    let subjectsPath = `${process.env.clientDir}/html/appendix`;
    return getDirectorySubjects(subjectsPath);
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

module.exports = {
    existsSync: existsSync,
    getDirectories: getDirectories,
    deleteFilesFromDirectory: deleteFilesFromDirectory,
    getPostNumbers: getPostNumbers,
    getLargestPostNumber: getLargestPostNumber,
    getFiles: getFiles,
    getFilesRecursively: getFilesRecursively,
    isDev: isDev,
    getPostSubjects: getPostSubjects,
    getGlossarySubjects: getGlossarySubjects,
    getAppendixSubjects: getAppendixSubjects,
    getRandomInt: getRandomInt,
    capatalizeFirstLetterOfEveryWord: capatalizeFirstLetterOfEveryWord
};