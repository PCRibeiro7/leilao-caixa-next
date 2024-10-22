/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
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
