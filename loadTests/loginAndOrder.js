// Creator: WebInspector 537.36

import { sleep, group, check, fail } from "k6";
import http from "k6/http";
import jsonpath from "https://jslib.k6.io/jsonpath/1.0.2/index.js";

export const options = {
  cloud: {
    distribution: {
      "amazon:us:ashburn": { loadZone: "amazon:us:ashburn", percent: 100 },
    },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    Scenario_1: {
      executor: "ramping-vus",
      gracefulStop: "30s",
      stages: [
        { target: 20, duration: "1m" },
        { target: 20, duration: "3m30s" },
        { target: 0, duration: "1m" },
      ],
      gracefulRampDown: "30s",
      exec: "scenario_1",
    },
  },
};

export function scenario_1() {
  let response;

  group("page_6 - https://pizza.jwt-stewart.com/", function () {
    // go to web page
    response = http.get("https://pizza.jwt-stewart.com/", {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        "if-modified-since": "Sat, 02 Nov 2024 00:07:38 GMT",
        "if-none-match": '"20a543977b7d618d46c2087fa5b46cf1"',
        priority: "u=0, i",
        "sec-ch-ua":
          '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
      },
    });
    sleep(13.9);

    // login
    response = http.put(
      "https://pizza-service.jwt-stewart.com/api/auth",
      JSON.stringify({ email: "a@jwt.com", password: "admin" }), // Use JSON.stringify
      {
        headers: {
          accept: "*/*",
          "Content-Type": "application/json", // Add this header
          origin: "https://pizza.jwt-stewart.com",
        },
      }
    );

    if (
      !check(response, {
        "status equals 200": (response) => response.status.toString() === "200",
      })
    ) {
      console.log(response.body);
      fail("Login was *not* 200");
    }
    const vars = {};
    vars["token1"] = jsonpath.query(response.json(), "$.token")[0];
    sleep(3.4);

    // get menu
    // Get menu
    response = http.get(
      "https://pizza-service.byucsstudent.click/api/order/menu",
      {
        headers: {
          accept: "*/*",
          authorization: `Bearer ${vars["token1"]}`,
          origin: "https://pizza.jwt-stewart.com",
        },
      }
    );
    sleep(0.5);

    // get franchise order screen
    response = http.get("https://pizza-service.jwt-stewart.com/api/franchise", {
      headers: {
        accept: "*/*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "if-none-match": 'W/"99-wIebmyCvQmxjeHmKFG4TlaX7CjE"',
        origin: "https://pizza.jwt-stewart.com",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        authorization: `Bearer ${vars["token1"]}`,
      },
    });
    sleep(6.9);

    // create pizza order
    response = http.post(
      "https://pizza-service.jwt-stewart.com/api/order",
      '{"items":[{"menuId":2,"description":"Pepperoni","price":0.0042}],"storeId":"1","franchiseId":1}',
      {
        headers: {
          accept: "*/*",
          "accept-encoding": "gzip, deflate, br, zstd",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          origin: "https://pizza.jwt-stewart.com",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          authorization: `Bearer ${vars["token1"]}`,
        },
      }
    );
    sleep(2.2);
    vars["jwt"] = jsonpath.query(response.json(), "$.jwt")[0];

    // verify pizza
    response = http.post(
      "https://pizza-factory.cs329.click/api/order/verify",
      JSON.stringify({ jwt: vars["jwt"] }),
      {
        headers: {
          accept: "*/*",
          "accept-encoding": "gzip, deflate, br, zstd",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          origin: "https://pizza.jwt-stewart.com",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          authorization: `Bearer ${vars["token1"]}`,
        },
      }
    );
  });
}
