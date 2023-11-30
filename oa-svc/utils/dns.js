const axios = require("axios");

const getDnsTxt = async (url) => {
  try {
    const results = [];
    const { data } = await axios.get(
      `https://cloudflare-dns.com/dns-query?name=${url}&type=TXT`,
      {
        headers: {
          accept: "application/dns-json",
        },
      }
    );

    if (!data.Answer) {
      return [];
    }

    for (const txt of data.Answer) {
      if (url !== txt.name) {
        const msg = "Mistached DNS name";
        const err = new Error();
        err.status = 400;
        err.code = "BAD_REQUEST";
        err.message = msg;
        throw err;
      }

      let dataList = txt.data.replace(/['"]+/g, "").split(" ");
      if (dataList[0] !== "openatts") {
        const msg = "Unsupported attestation framework";
        const err = new Error();
        err.status = 400;
        err.code = "BAD_REQUEST";
        err.message = msg;
        throw err;
      }

      const dnsResult = {
        framework: "",
        net: "",
        netId: "",
        addr: "",
      };
      dnsResult.framework = dataList[0];
      for (let i = 1; i < dataList.length; i++) {
        let list = dataList[i].split("=");
        if (list[0] === "net") {
          dnsResult.net = list[1];
        } else if (list[0] === "netId") {
          dnsResult.netId = list[1];
        } else if (list[0] === "addr") {
          dnsResult.addr = list[1];
        }
      }
      results.push(dnsResult);
    }

    return results;
  } catch (err) {
    err.status = 503;
    err.code = "SERVICE_UNAVAILABLE";
    err.message = "Failed to get DNS_TXT record";
    throw err;
  }
};

module.exports = { getDnsTxt };
