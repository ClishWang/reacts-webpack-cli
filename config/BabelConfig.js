
module.exports = function () {
    return {
        "presets": ["@babel/preset-env", ["@babel/preset-react", {"runtime": "automatic"}]],
        "plugins": [
            ["@babel/plugin-proposal-decorators", {"legacy": true}],
            ["@babel/plugin-proposal-private-methods", { "loose": true }],
            ["@babel/plugin-proposal-class-properties", { "loose": true }],
            ["@babel/plugin-proposal-private-property-in-object", { "loose": true }],
            "@babel/plugin-proposal-export-default-from",
            "@babel/plugin-proposal-export-namespace-from",
            "@babel/plugin-transform-runtime"
        ]
    };
};