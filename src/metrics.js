const config = require("./config.js");
const os = require("os");

class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.getRequests = 0;
    this.putRequests = 0;
    this.postRequests = 0;
    this.deleteRequests = 0;
    this.currentUsers = 0;
    this.authAttemptsSuccess = 0;
    this.authAttemptsFailed = 0;
    this.cpuUsage = 0;
    this.memoryUsage = 0;
    this.pizzasSold = 0;
    this.creationFailures = 0;
    this.revenue = 0;
    this.serviceEndpointLatency = 0;
    this.pizzaCreationLatency = 0;

    // This will periodically sent metrics to Grafana
    const timer = setInterval(() => {
      this.sendMetricToGrafana("request", "all", "total", this.totalRequests);
      this.sendMetricToGrafana("request", "get", "get", this.getRequests);
      this.sendMetricToGrafana("request", "post", "post", this.postRequests);
      this.sendMetricToGrafana("request", "put", "put", this.putRequests);
      this.sendMetricToGrafana(
        "request",
        "delete",
        "delete",
        this.deleteRequests
      );
      this.sendMetricToGrafana(
        "users",
        "put",
        "currentUsers",
        this.currentUsers
      );
      this.sendMetricToGrafana(
        "authAttempt",
        "all",
        "success",
        this.authAttemptsSuccess
      );
      this.sendMetricToGrafana(
        "authAttempt",
        "all",
        "failed",
        this.authAttemptsFailed
      );
      this.sendMetricToGrafana(
        "usage",
        "all",
        "cpu_usage",
        this.getCpuUsagePercentage()
      );
      this.sendMetricToGrafana(
        "usage",
        "all",
        "memory_usage",
        this.getMemoryUsagePercentage()
      );
      this.sendMetricToGrafana("pizza", "post", "pizzas_sold", this.pizzasSold);
      this.sendMetricToGrafana(
        "pizza",
        "all",
        "creation_failures",
        this.creationFailures
      );
      this.sendMetricToGrafana("revenue", "any", "revenue", this.revenue);
      this.sendMetricToGrafana(
        "latency",
        "any",
        "endpoint_service",
        this.serviceEndpointLatency
      );
      this.sendMetricToGrafana(
        "latency",
        "any",
        "pizza_creation",
        this.pizzaCreationLatency
      );
    }, 10000);
    timer.unref();
  }

  incrementRequests() {
    this.totalRequests++;
  }
  incrementGetRequests() {
    this.getRequests++;
  }
  incrementPostRequests() {
    this.postRequests++;
  }
  incrementDeleteRequests() {
    this.deleteRequests++;
  }
  incrementPutRequests() {
    this.putRequests++;
  }
  incrementCurrentUsers() {
    this.currentUsers++;
  }
  decrementCurrentUsers() {
    this.currentUsers--;
    if (this.currentUsers < 0) {
      this.currentUsers = 0;
    }
  }

  incrementAuthAttemptsSuccess() {
    this.authAttemptsSuccess++;
  }
  incrementAuthAttemptsFailed() {
    this.authAttemptsFailed++;
  }
  incrementPizzasSold(num) {
    this.pizzasSold += num;
  }
  incrementCreationFailures(num) {
    this.creationFailures += num;
  }
  incrementRevenue(num) {
    this.revenue += num;
  }
  setServiceLatency(num) {
    this.serviceEndpointLatency += num;
  }

  setPizzaCreationLatency(num) {
    this.pizzaCreationLatency += num;
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return cpuUsage.toFixed(2) * 100;
  }
  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
  }

  sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.metrics.source},method=${httpMethod} ${metricName}=${metricValue}`;

    fetch(`${config.metrics.url}`, {
      method: "post",
      body: metric,
      headers: {
        Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          console.error("Failed to push metrics data to Grafana");
        } else {
          console.log(`Pushed ${metric}`);
        }
      })
      .catch((error) => {
        console.error("Error pushing metrics:", error);
      });
  }
  requestTracker(req, res, next) {
    metrics.incrementRequests(); // Increment total requests

    // Increment based on HTTP method
    switch (req.method) {
      case "GET":
        metrics.incrementGetRequests();
        break;
      case "POST":
        metrics.incrementPostRequests();
        break;
      case "PUT":
        metrics.incrementPutRequests();
        // if the put is a login and the login is successful - we need to increment currentUsers
        break;
      case "DELETE":
        metrics.incrementDeleteRequests();
        break;
      default:
        break;
    }
    next();
  }

  addOrder(order) {
    this.incrementPizzasSold(order.items.length);
    let total = 0;
    order.items.forEach((pizza) => {
      total += pizza.price;
    });
    this.incrementRevenue(total);
  }
}

const metrics = new Metrics();
module.exports = metrics;
