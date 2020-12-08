module.exports = function () {
    return {
        preset: 'chrome',
        webpack: function (config) {
            return config;
        },
        devServer: {
            hot: true,
            port: 8080
        },
        analyse: {},
        injectStaticHostUrl: null   // 自定义处理 static host
    }
}