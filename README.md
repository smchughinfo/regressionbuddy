**RegressionBuddy**

This repository is the start of what would be several years of content-creation. Unfortunately, after creating the site I discovered the time demands for each post were just too great. I still see a ton of value in the site but I just don't have the means to work on it right now :(

This is for a math website (Algebra, Trigonometry, Calculus, Vector Calculus, Statistics, and Linear Algebra). The idea is it has practice problems for topics in each subject. It also has a little appendix so if you forget how to do some type of problem you can easily look it up. The problem the site solves is math retention. We spend years learning so much math and just forget it. Why? If there were a way to casually do a few problems every couple days one could stay sharp with their math skills. That's what I am trying to create with this site.

To install locally:

    git clone https://github.com/smchughinfo/regressionbuddy.git
    cd regressionbuddy/server
    npm install
    node scripts/index.js
    Open browser to http://localhost:8080

You can change the port by changing `process.env.port = 8080;` in server/scripts/globals.js.
