import EncodingPlugin from 'encoding-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.plugins.push(
            new EncodingPlugin({
                encoding: "ISO-8859-1",
            })
        );
        config.module.rules.push({
            // make all files ending in .jsonl use the `jsonlines-loader`
            test: /\.jsonl$/,
            use: "jsonlines-loader",
            type: "javascript/auto",
        });
        return config;
    },
};

export default nextConfig;
