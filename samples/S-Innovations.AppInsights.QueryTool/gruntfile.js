
function npmcopy(grunt) {
    var data = grunt.file.readJSON("npmcopy.json");
    var packages = grunt.file.readJSON("package.json");

    for (var key in data) {
        var copy = [];
        if (typeof data[key] === "string") {
            if (packages.dependencies[data[key].split('/')[0]] || packages.devDependencies[data[key].split('/')[0]]) {
                copy.push(data[key]);
            }
        } else {
            for (var i in data[key]) {
                if (packages.dependencies[data[key][i].split('/')[0]] || packages.devDependencies[data[key][i].split('/')[0]]) {
                    copy.push(data[key][i]);
                }
            }
        }

        if (copy.length === 0) {
            delete data[key];
        } else {
            data[key] = copy;
        }
    }
    console.log(data);
    return data;
}

var outputPath = "artifacts/app";

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-npmcopy');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.initConfig({
        copy: {
            bin: {
                files: [

                    {
                        expand: true, cwd: "src", src: ["**/content/**/*.jpg", '**/fonts/**/*.eot', '**/fonts/**/*.svg', '**/fonts/**/*.ttf', '**/fonts/**/*.woff', '**/fonts/**/*.woff2'],
                        dest: outputPath + "/libs/AppInsightsQueryReporter/src"
                    },
                ]//
            },
            lib: {
                files: [
                    { expand: true, cwd: "src", src: ["**/*.less", "**/*.json", "**/templates/**/*.html"], dest: outputPath + "/libs/AppInsightsQueryReporter/src" }
                ]//
                ,
                options: {
                    process: function (content, srcpath) {

                        if (srcpath.split(".").pop() === 'json') {
                            return require("strip-json-comments")(content);
                        }

                        return content;
                    },
                },
            }
        },
        npmcopy: {

            libs: {
                options: {
                    destPrefix: outputPath + '/libs'
                },
                files: npmcopy(grunt)
            }
        }
    });
};