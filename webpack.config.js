const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const {
  getEntries,
  getHtmlWebpackPlugins,
  getApiFallbackRewrites
} = require('./webpack.utils');

module.exports = {
  mode: 'development',
  entry: getEntries(),
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-typescript']
          }
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        loader: 'file-loader'
      }
    ]
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, './public'),
    publicPath: '/',
  },
  resolve: {
    extensions: [ '.js', '.jsx','.ts', '.tsx' ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 9000,
    historyApiFallback: {
      index: './src/index.html',
      rewrites: getApiFallbackRewrites(),
    },
  },
  plugins:[
    ...getHtmlWebpackPlugins({isDev: true}),
    new CopyPlugin({
      patterns: [{
        from: './assets',
        to: './assets'
      }]
    })
  ]
}