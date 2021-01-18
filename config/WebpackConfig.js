const path = require('path');
const webpack = require('webpack');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const Utils = require('../lib/utils');

const formatEntry = (entry, preEntryValue = [], cb) => {
    Object.keys(entry).forEach(key => {
        if (Array.isArray(entry[key])) {
            entry[key].unshift.apply(entry[key], preEntryValue);
        } else {
            entry[key] = preEntryValue.concat(entry[key]);
        }
        cb && cb(key);
    });
};
const getDevEntry = (entries, devEntry) => {
    if (devEntry && Array.isArray(devEntry) && devEntry.length > 0) {
        return devEntry.reduce((obj, key) => {
            obj[key] = entries[key];
            return obj;
        }, {});
    }
    return entries;
}
// 基础配置
const _default = (env = 'development') => {
    const mode = env !== 'development' ? 'production' : env;
    const output = {
        path: path.join(process.cwd(), `.${path.sep}dist${path.sep}`)
    };
    const plugins = [
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
                    options: {
                        postcssOptions: { plugins: ['autoprefixer'] }
                    }
                },
                'sass-loader'
            ],
            sideEffects: true,
        }, {
            test: /\.(png|svg|gif|jpe?g|)$/,
            use: {
                loader: 'url-loader',
                options: {
                    limit: 0,
                    name: '[name].[hash:8].[ext]',
                    outputPath: 'images',
                    emitFile: true
                }
            }
        }
    ]};
    const resolve = {
        extensions: ['.js', '.jsx', '.css', '.scss'],
        modules: [Utils.resolveNodeModulesPath(), 'node_modules']
    };
    const externals = {
        'react': {
            amd: 'react',
            commonjs: 'react',
            commonjs2: 'react',
            root: 'React',
            var: 'React'
        },
        'react-dom': {
            amd: 'react-dom',
            commonjs: 'react-dom',
            commonjs2: 'react-dom',
            root: 'ReactDOM',
            var: 'ReactDOM'
        }
    };
    return { entry: {}, mode, output, plugins, module, resolve, externals };
};
// 获取不同环境基础配置
exports.getDefaultConfig = env => _default(env);

exports.mixedDevelopment = (config, {devPath, devServer, devBuildOnly, favicon, sourceMap = ''}) => {
    const nodeModulesPath = Utils.resolveNodeModulesPath();
    let preEntry = [];
    process.noDeprecation = true;   // 弃用警告
    // dev 模式下配置
    config.output.publicPath = devPath;
    config.output.filename = '[name].js';
    config.plugins.push(new MiniCssExtractPlugin({filename: '[name].css'}));
    // devBuildOnly 替换 entry
    config.entry = getDevEntry(config.entry, devBuildOnly);
    // 热更新模块
    if (devServer.hot) {
        let patch = path.join(nodeModulesPath, `react-hot-loader${path.sep}patch`);
        let webpackDevServer = `${path.join(nodeModulesPath, `webpack-dev-server${path.sep}client`)}?http://127.0.0.1:${devServer.port}/`
        let hotDevServer = path.join(nodeModulesPath, `webpack${path.sep}hot${path.sep}dev-server`);
        preEntry = preEntry.concat(patch, webpackDevServer, hotDevServer);
        // 热更新module和插件配置
        config.module.rules.unshift({
            test: /\.jsx?/,
            use: require.resolve(`react-hot-loader${path.sep}webpack`),
            exclude: /node_modules/
        });
        config.plugins.push(new webpack.HotModuleReplacementPlugin());
    }
    // 添加插件
    formatEntry(config.entry, preEntry, entry => {
        config.plugins.push(new HtmlWebpackPlugin({
            template: path.join(__dirname, `..${path.sep}template${path.sep}js.ejs`),
            filename: process.cwd() + `${path.sep}dist_ejs${path.sep}${entry}.js.ejs`,
            chunks: [entry],
            inject: false,
        }), new HtmlWebpackPlugin({
            template: path.join(__dirname, `..${path.sep}template${path.sep}css.ejs`),
            filename: process.cwd() + `${path.sep}dist_ejs${path.sep}${entry}.css.ejs`,
            chunks: [entry],
            inject: false,
            favicon,
        }));
    });
    sourceMap && (config.devtool = sourceMap);
};

exports.mixedProduction = (config, {libs, useTempPath, favicon, testPath, cdnPath}) => {
    const isProduction = process.env.NODE_ENV === 'production';
    config.output.publicPath = isProduction ? cdnPath : testPath;
    config.output.filename = libs ? '[name].js' : '[name].[chunkhash:8].js';
    config.plugins.unshift(new CleanWebpackPlugin({
        dry: false,
        verbose: true,
        cleanOnceBeforeBuildPatterns: ["**/*", './dist'],
        dangerouslyAllowCleanPatternsOutsideProject: true
    }));
    config.plugins.push(new MiniCssExtractPlugin({filename: libs ? '[name].css' : '[name][chunkhash:8].css'}));
    const tempPath = useTempPath && isProduction ? 'dist_ejs_temp' : 'dist_ejs';
    formatEntry(config.entry, [], entry => {
        if (!!libs) return;
        config.plugins.push(new HtmlWebpackPlugin({
            template: path.join(__dirname, `..${path.sep}template${path.sep}js.ejs`),
            filename: process.cwd() + `${path.sep}${tempPath}${path.sep}${entry}.js.ejs`,
            chunks: [entry],
            inject: false
        }), new HtmlWebpackPlugin({
            template: path.join(__dirname, `..${path.sep}template${path.sep}css.ejs`),
            filename: process.cwd() + `${path.sep}${tempPath}${path.sep}${entry}.css.ejs`,
            chunks: [entry],
            inject: false,
            favicon
        }));
    });
};

exports.mixedNodeSSR = ({nodeServerEntry, devBuildOnly, cdnPath, testPath, devPath, webpackConfig: {resolve}}) => {
    const serverConfig = _default('NodeSSR');
    const env = process.env.NODE_ENV;
    const entry = getDevEntry(nodeServerEntry, devBuildOnly);
    formatEntry(entry);
    return Object.assign(serverConfig, {
        entry,
        resolve,
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
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 0,
                        name: '[name].[hash:8].[ext]',
                        outputPath: 'images',
                        emitFile: false
                    }
                }
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