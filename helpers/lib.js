/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
exports.execShellCommand = function(cmd) {
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(stderr);
                reject(error);
            } else {
                console.log(stdout);
                resolve(stdout? stdout : stderr);
            }
        });
    });
}
   