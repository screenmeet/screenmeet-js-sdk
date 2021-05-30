var webpack = require('webpack');


module.exports = {
  // your root file
  entry: './src/app/index.ts',
  
  // output JS bundle to: build/bundle.js
  output: {
    path: __dirname + '/build',
    filename: 'bundle.js'
  },
  
  resolve: {
    // you can load named modules from any dirs you want.
    // attempts to find them in the specified order.
    // modulesDirectories: [
    //   './src/lib',
    //   'node_modules'
    // ]
    extensions: [".ts", ".js"]
  },
  
  
  plugins: ([
    // Avoid publishing files when compilation failed:
    //new webpack.NoErrorsPlugin(),
    
    // Aggressively remove duplicate modules:
    //new webpack.optimize.DedupePlugin(),

  ]).concat(process.env.WEBPACK_ENV==='dev' ? [] : [
    //new webpack.optimize.OccurenceOrderPlugin(),
    
    // minify the JS bundle
    // new webpack.optimize.UglifyJsPlugin({
    //   output: { comments: false },
    //   exclude: [ /\.min\.js$/gi ]		// skip pre-minified libs
    // })
  ]),
  
  module: {
    // you can tell webpack to avoid parsing for dependencies in any files matching an Array of regex patterns
    noParse: [
      /(node_modules|~)\/(crappy\-bundled\-lib|jquery)\//gi
    ],
  
    rules: [
      {
        test : /\.ts?$/,
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.json'
        }
      }
    ]
  
    // preLoaders: [
    //   // before hitting the actual loaders, load any sourcemaps specified by npm modules
    //   { loader: 'source-map' }
    // ],
    
    // loaders: [
    //   // transpile ES6/7 to ES5 via babel
    //   {
    //     test: /\.jsx?$/,
    //     exclude: /node_modules/,
    //     loader: 'babel'
    //   },
    //   // bundle LESS and CSS into a single CSS file, auto-generating -vendor-prefixes
    //   {
    //     test: /\.(less|css)$/,
    //     exclude: /\b(some\-css\-framework|whatever)\b/i,
    //     loader: ExtractTextPlugin.extract("style?sourceMap", "css?sourceMap!autoprefixer?browsers=last 2 version!less")
    //   }
    // ]
  },
  // Pretty terminal output
  stats: { colors: true },
  
  // Generate external sourcemaps for the JS & CSS bundles
  devtool: 'source-map',
  
  // `webpack-dev-server` spawns a live-reloading HTTP server for your project.
  devServer: {
    port: process.env.PORT || 8080,
    contentBase: './src',
    historyApiFallback: true
  }
};