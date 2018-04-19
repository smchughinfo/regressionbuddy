const { join } = require("path");
const { getLargestPostNumber } = require("./utilities.js");

module.exports = {
    initialize: () => {
        process.env.name = "prod"; // if "dev" rebuilds all pages anytime a file in process.env.clientDir is modified.
        process.env.buildOnRequest = true; // if true only rebuilds page when requested from server. 

        process.env.port = 8080;
        process.env.defaultSubject = "algebra";
        process.env.hostName = process.env.name === "dev" ? `http://localhost:${process.env.port}` : "https://regressionbuddy.com" 
        process.env.clientDir = join(__dirname, "/../../client");
        process.env.publicDir = join(process.env.clientDir, "/public"); 
        process.env.buildDir = join(process.env.publicDir, "/build");
        process.env.postsDir = join(process.env.clientDir, "/posts");
        process.env.postTemplatesDir = join(process.env.clientDir, "/html/post_html"),
        process.env.templatesDir = join(process.env.clientDir, "/html/templates")

        process.env.buildDirURL = "build";

        process.env.lastPost = getLargestPostNumber();
    }
}