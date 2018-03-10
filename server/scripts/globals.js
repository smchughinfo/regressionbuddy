const { join } = require("path");
const { getLargestPostNumber } = require("./utilities.js");

module.exports = {
    initialize: () => {
        process.env.name = "prod";

        process.env.defaultSubject = "algebra";
        process.env.hostName = process.env.name === "dev" ? "http://localhost:8080" : "https://regressionbuddy.com" 
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