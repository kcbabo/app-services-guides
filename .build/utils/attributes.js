const glob = require("glob");
const fs = require("fs");
const path = require("path");

const attributesHeaderComment = "////\n" +
    "START GENERATED ATTRIBUTES\n" +
    "WARNING: This content is generated by running npm --prefix .build run generate:attributes\n" +
    "////\n";

const attributesFooterComment = "\n////\n" +
    "END GENERATED ATTRIBUTES\n" +
    "////";


const injectAttributes = () => {

    const rootDir = path.normalize(`${__dirname}/../../`);

    const rawAttributes = fs.readFileSync(path.join(rootDir, "_attributes.adoc"), "utf-8").toString();
    const attributes = rawAttributes.split("\n").filter(line => !line.trim().startsWith("// _attributes.adoc")).join("\n");

    const ignoreFiles = [];

    const ignoreFilesGlobs = fs.readFileSync(path.normalize(`${__dirname}/../../.adocignore`), "utf-8").toString();

    ignoreFilesGlobs.split("\n").filter(line => !line.startsWith("#")).filter(line => line !== "").forEach(g => {
        const pattern = `${__dirname}/../../${g}`;
        ignoreFiles.push(...glob.sync(pattern));
    });

    glob(`${__dirname}/../../**/*.adoc`, {}, (er, files) => {
        files.forEach(file => {
            // Skip if file is ignored
            if (ignoreFiles.includes(file)) return;
            const data = fs.readFileSync(file, "utf-8").toString();
            const stat = fs.statSync(file);
            const hIndex = data.indexOf(attributesHeaderComment);
            const fIndex = data.indexOf(attributesFooterComment);
            let output = data;
            let injected = `${attributesHeaderComment}${attributes}${attributesFooterComment}`;
            if (hIndex > 0 && fIndex > 0) {
                const before = data.substring(0, hIndex);
                const after = data.substr(fIndex + attributesFooterComment.length);
                output = `${before}${injected}${after}`;
            }
            fs.writeFileSync(file, output, {encoding: "utf-8", mode: stat.mode});
        });
    });

};

injectAttributes();