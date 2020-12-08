const path = require('path');
exports.resolveNodeModulesPath = () => {
    const sep = path.sep;
    let nodeModulesPath;
    try {
        const clientPath = require.resolve(`webpack-dev-server${sep}client`);
        nodeModulesPath = clientPath.replace(`webpack-dev-server${sep}client${sep}index.js`, '');
    } catch (e) {
        nodeModulesPath = path.join(__dirname, `..${sep}..${sep}`);
    }
    return nodeModulesPath;
};