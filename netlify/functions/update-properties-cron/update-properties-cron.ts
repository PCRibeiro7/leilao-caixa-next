import { HandlerEvent } from "@netlify/functions";
import axios from "axios";

const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_RJ.csv",
    headers: {
        Cookie: "SIMOV=ffffffff09ca9ed845525d5f4f58455e445a4a423660; __uzma=c8d6899a-ced3-4356-97c1-62d11d7a7926; __uzmb=1751068676; __uzmc=807631078860; __uzmd=1751068676; __uzme=8827",
    },
};

async function makeRequest() {
    try {
        const response = await axios.request(config);
        console.log(JSON.stringify(response.data));
    } catch (error) {
        console.log(error);
    }
}

// To learn about scheduled functions and supported cron extensions,
// see: https://ntl.fyi/sched-func
// export const handler = schedule("*/5 * * * *", async (event) => {
export const handler = async (event: HandlerEvent) => {
    const eventBody = JSON.parse(event.body || "{}");
    console.log(`Next function run at ${eventBody?.next_run}.`);

    makeRequest();

    return {
        statusCode: 200,
    };
};
