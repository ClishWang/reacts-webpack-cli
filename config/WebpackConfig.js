const path = require('path');
const webpack = require('webpack');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const nodeExternals = require('webpack-node-externals');
const Utils = require('../lib/utils');
// 基础配置
const _default = (env = 'development') => {
    const output = path.join(process.cwd(), `.${path.sep}dist${path.sep}`);
    const plugins = [
        new MiniCssExtractPlugin(),
        new webpack.DefinePlugin({ // 定义全局变量
            __IS_SSR__: false,
            __MODE__: `'${env}'`,
            'process.env.NODE_ENV': `'${env}'`,
        }),
        new webpack.optimize.AggressiveMergingPlugin(), // 合并chunks
        new ProgressBarPlugin(), // 打包进度显示
        new webpack.ProvidePlugin({ // 自动引入模块
            React: 'react',
            ReactDOM: 'react-dom',
        }),
    ];
    const module = {rules: [
        {
            enforce: 'pre',
            test: /\.jsx?$/,
            use: [{
                loader: 'babel-loader',
                options: require('./BabelConfig.js')(),
            }],
            exclude: /node_modules/,
            sideEffects: false
        }, {
            test: /\.(sa|sc|c)ss$/,
            use: [
                MiniCssExtractPlugin.loader,
                'css-loader',
                {
                    loader: 'postcss-loader',
                    options: { plugins: [ require('autoprefixer') ] }
                },
                'sass-loader'
            ],
            sideEffects: true,
        }, {
            test: /\.(png|svg|gif|jpe?g|)$/,
            use: {
                loader: 'url-loader',
                limit: 1024,
                name: '[name].[hash:8].[ext]',
                outputPath: 'images'
            }
        }
    ]};
    const resolve = {
        extensions: ['.js', '.jsx', '.css', '.scss'],
        modules: [Utils.resolveNodeModulesPath(), 'node_modules']
    }
    return { entry: {}, output, module, plugins, resolve };
};
// 获取不同环境基础配置
exports.getDefaultConfig = env => _default(env);

exports.mixedDevelopment = (config, devServerConfig, fullyConfig) => {

};

exports.mixedProduction = (config, fullyConfig) => {

};

exports.mixedNodeSSR = ({nodeServerEntry: entry, cdnPath, testPath, devPath}) => {
    const serverConfig = _default('NodeSSR');
    const env = process.env.NODE_ENV;

    Object.keys(entry).forEach(key => {
        if (!Array.isArray(entry[key])) {
            entry[key] = [entry[key]];
        }
    });

    return Object.assign(serverConfig, {
        entry,
        target: 'node',
        output: {
            path: path.join(process.cwd(), `.${path.sep}dist_server${path.sep}`),
            filename: '[name].server.js',
            libraryTarget: 'commonjs2',
            publicPath: env === 'production' ? cdnPath : env === 'test' ? testPath : devPath
        },
        module: { rules: [
            {
                test: /\.jsx?$/,
                use: {
                    loader: 'babel-loader',
                    options: require('./BabelConfig.js')(),
                },
                exclude: /node_modules/
            }, {
                test: /\.(sa|sc|c)ss$/,
                use: 'null-loader'
            }, {
                test: /\.(png|svg|gif|jpe?g|)$/,
                use: 'url-loader'
            }
        ] },
        plugins: [
            new webpack.ProvidePlugin({
                React: 'react',
                ReactDOM: 'react-dom',
            }),
            new webpack.DefinePlugin({
                __IS_SSR__: true,
                __MODE__:`'node_ssr'`
            }),
        ],
        externals: nodeExternals()
    });
};