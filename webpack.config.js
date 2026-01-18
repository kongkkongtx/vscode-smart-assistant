const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './webviews/index.tsx',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'webview.js',
    publicPath: ''
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      'react': path.resolve('./node_modules/react')
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.webview.json'),
          },
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './webviews/index.html',
      filename: 'index.html'
    }),
    new CopyPlugin({
      patterns: [
        { from: 'webviews/styles.css', to: 'webview.css' },
        { from: 'webviews/model-config.css', to: 'model-config.css' }
      ]
    })
  ],
  mode: 'development'
};