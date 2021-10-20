const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");

const config = {
    target: "web",
    mode: "development",
    devtool: "eval-source-map",
    devServer: {
        static: false,
        client: {
            overlay: true,
        },
    },
    entry: {
        app: {
            import: "./src/index.js",
            dependOn: [
                "app-vendors"
            ]
        },
        "app-vendors": [
            "redux",
        ],
    },
    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "./dist"),
        publicPath: "",
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.m?js$/i,
                exclude: /node_modules/,
                use: [
                    "babel-loader"
                ]
            },
            {
                test: /\.css$/i,
                use: [
                    "style-loader",
                    "css-loader"
                ]
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: "asset/resource",
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: "asset/resource"
            }
        ]
    },
    plugins: [
        new HTMLWebpackPlugin({
            title: "Battleship Game",
            favicon: "./assets/icons/battleship-icon.png",
        })
    ]
}

module.exports = config;
