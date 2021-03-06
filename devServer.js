const chalk = require('chalk');
const cookieParser = require('cookie-parser');

const path = require('path');
const fs = require('fs');

function sendJson(req, res, next, file, root) {
  res.sendFile(
    file,
    {
      root,
      dotfiles: 'deny',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    (err) => {
      if (err) {
        console.error(chalk.red(err.message), file);
        next(err);
      }
    }
  );
}

module.exports = {
  proxy: {
    '/diydev': {
      target: 'http://localhost:3009',
      ws: true,
      changeOrigin: true,
      pathRewrite: {
        '^/diydev': '',
      },
    },
  },
  historyApiFallback: true,
  progress: true,
  host: '0.0.0.0',
  port: 3009,
  hot: true,
  disableHostCheck: true,
  inline: true,
  compress: true,
  contentBase: ['./dist'],
  publicPath: '/',
  stats: 'errors-only',
  staticOptions: {
    maxAge: 365 * 24 * 3600 * 1000,
  },
  before(app) {
    [['/api/rest', './mock/api/rest']].forEach(([url, targetPath]) => {
      app.use(url, cookieParser(), (req, res, next) => {
        const filePath = path.join(process.cwd(), targetPath, req.path);
        const file = req.path;
        const checkFiles = ['.json', '']
          .map((ext) => filePath + ext)
          .map(
            (p) =>
              new Promise((resolve) => {
                fs.exists(p, (exists) => {
                  resolve(exists);
                });
              })
          );
        Promise.all(checkFiles).then(([json, normal]) => {
          if (json) {
            sendJson(req, res, next, file + '.json', targetPath);
          } else if (normal) {
            sendJson(req, res, next, file, targetPath);
          } else {
            next();
          }
        });
      });
    });
  },
};
