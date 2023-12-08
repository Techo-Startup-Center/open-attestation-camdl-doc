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

    if (data.Answer) {
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
          continue;
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
    }
    if (results.length === 0) {
      const msg = "No DNS TXT record found";
      const err = new Error();
      err.status = 404;
      err.code = "NOT_FOUND";
      err.message = msg;
      throw err;
    }
    return results;
  } catch (err) {
    throw err;
  }
};

module.exports = { getDnsTxt };
