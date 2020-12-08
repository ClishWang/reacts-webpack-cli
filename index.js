const fs = require('fs');
const path = require('path');
const {program} = require('commander');
const inquirer = require('inquirer');
const ejs = require('ejs');
const rm = require('rimraf');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const pkg = require('./package.json');
const WebpackConfig = require('./config/WebpackConfig');

const DIST_EJS_NAME = 'dist_ejs';
const statsOptions = {
    colors: true,
    children: false,
    chunkModules: false,
    chunks: false,
    modules: false,
};

program.version(pkg.version);
// 删除dist目录文件
const removeDirectory = (callback) => {
    const distPath = path.join(process.cwd(), './dist/*');
    rm(distPath, err => {
        console.log(`删除${distPath}失败, 请确认后重试`);
        return;
    });
    console.log(`删除${distPath}成功`);
    callback && callback();
};
// 混合webpack配置
const getFullyConfig = (projectConfigFilePath, env) => {
    let config = {};
    try {
        config = require(path.join(process.cwd(), projectConfigFilePath));
    } catch (err) {
        console.log('读取项目内 webpack.config.js 文件失败');
    }
    // 兼容项目内配置文件
    config = Object.assign(require('./config/DefaultConfig')(), config);
    config.webpackConfig = config.webpack(WebpackConfig.getDefaultConfig(env));
    return config;
};

// 初始化生成webpack文件
program.command('init')
    .description('初始化生成webpack文件')
    .action(() => {
        inquirer.prompt([{
            type: 'list',
            name: 'type',
            message: '需要创建以下那种类型？',
            choices: ['html-spa', 'node-spa', 'node-ssr']
        },{
            type: 'input',
            name: 'devServerPort',
            message: '需要指定 dev server 端口号？',
            default: '8080'
        }, {
            type: 'input',
            name: 'entryName',
            message: '需要指定入口文件名称？',
            default: 'main'
        }, {
            type: 'input',
            name: 'entryJsPath',
            message: '需要指定入口文件路径？',
            default: './src/index.js'
        }]).then(answers => {
            const readPath = path.join(__dirname, './template/webpack.config.js.ejs');
            const writePath = path.join(process.cwd(), './webpack.config.js');
            fs.writeFileSync(writePath, ejs.render(fs.readFileSync(readPath, 'utf8'), answers));
            console.log('\x1b[36m创建配置文件完成: webpack.config.js\x1b[0m');
            console.log('\x1b[36m启动项目开始愉快的工作吧～\x1b[0m');
        }).catch(err => console.log(err));
    });
// 开发环境

// 正式环境

// ssr打包
program.command('ssr')
    .description('ssr打包入口页面')
    .option('-c --config [config]', 'webpack配置文件', './webpack.config.js')
    .action(cmd => {
        const webpackConfig = getFullyConfig(cmd.config, 'NodeSSR');
        const ssrConfig = WebpackConfig.mixedNodeSSR(webpackConfig);
        webpack(ssrConfig, (err, stats) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stats.toString(statsOptions));
        });
    });
// 文件替换
program.command('rename')
    .description('更新dist_ejs文件目录')
    .action(() => {
        const distEjs = path.join(process.cwd(), `./${DIST_EJS_NAME}`);
        const distEjsTemp = path.join(process.cwd(), `./${DIST_EJS_NAME}_temp`);
        // 判断是否存在要更新的内容
        if (!fs.existsSync(distEjsTemp)) {
            console.log('没有需要更新的dist_ejs内容');
            return;
        }
        // 重命名当前文件目录
        fs.existsSync(distEjs) && fs.renameSync(distEjs, `${distEjs}_old`);
        fs.renameSync(distEjsTemp, distEjs);
        rm(`${distEjs}_old`, err => {
            if (err) {
                console.log(`${DIST_EJS_NAME}文件目录更新失败`);
                return;
            }
            console.log(`${DIST_EJS_NAME}文件目录更新成功`);
        });
    });

program
    .command('test')
    .description('测试commander')
    .option('-i, --info [info]', '测试信息输出', 'This is test info')
    .action(cmd => {
        console.log(cmd.info);
    });


program.parse(process.argv);